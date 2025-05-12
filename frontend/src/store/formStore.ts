import { create } from "zustand";
import { nanoid } from "nanoid";
import { Form, Question } from "../types/aiTypes";
import { supabase } from "../lib/supabase";
import { useAuth } from "../lib/auth";

interface FormState {
  forms: Form[];
  drafts: Form[];
  loading: boolean;
  error: string | null;
  fetchForms: () => Promise<void>;
  fetchDrafts: () => Promise<void>;
  createForm: (form: Form) => Promise<Form>;
  updateForm: (id: string, form: Partial<Form>) => Promise<void>;
  deleteForm: (id: string) => Promise<void>;
  saveDraft: (form: Form) => void;
  deleteDraft: (id: string) => void;
  publishForm: (form: Form) => Promise<void>;
  generateShareLink: (formId: string) => Promise<string>;
  addQuestion: (
    formId: string,
    question: Omit<Question, "id">
  ) => Promise<void>;
  updateQuestion: (
    formId: string,
    questionId: string,
    question: Partial<Question>
  ) => Promise<void>;
  deleteQuestion: (formId: string, questionId: string) => Promise<void>;
}

export const useFormStore = create<FormState>((set, get) => ({
  forms: [],
  drafts: [],
  loading: false,
  error: null,

  fetchForms: async () => {
    set({ loading: true, error: null });
    try {
      const { data: forms, error: formsError } = await supabase
        .from("forms")
        .select("*")
        .order("updated_at", { ascending: false });

      if (formsError) throw formsError;

      const formsWithQuestions = await Promise.all(
        (forms || []).map(async (form) => {
          const { data: questions, error: questionsError } = await supabase
            .from("goform_questions")
            .select("*")
            .eq("form_id", form.id)
            .order("order", { ascending: true });

          if (questionsError) throw questionsError;

          return {
            ...form,
            created_at: new Date(form.created_at),
            updated_at: new Date(form.updated_at),
            is_template: form.is_template ? true : false,
            sharing_enabled: form.sharing_enabled ? true : false,
            questions: questions || [],
          };
        })
      );

      set({ forms: formsWithQuestions });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ loading: false });
    }
  },

  fetchDrafts: async () => {
    const drafts = JSON.parse(localStorage.getItem("formDrafts") || "[]");
    set({ drafts });
  },

  createForm: async (formData) => {
    const { questions, ...formFields } = formData;

    console.log("formData", formData);
    

    const formToInsert = {
      ...formFields,
    //   user_id: user?.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_template: formFields.is_template ?? false,
      sharing_enabled: formFields.sharing_enabled ?? false,
    };

    const { data: form, error: formError } = await supabase
      .from("forms")
      .insert([formToInsert])
      .select()
      .single();

    if (formError) throw formError;

    if (questions && questions.length > 0) {
      const questionsWithFormId = questions.map((question) => ({
        ...question,
        form_id: form.id,
      }));

      console.log("questionsWithFormId", form.id);
      

      const { error: questionsError } = await supabase
        .from("goform_questions")
        .insert(questionsWithFormId);

      if (questionsError) throw questionsError;
    }

    const { data: createdQuestions, error: fetchError } = await supabase
      .from("goform_questions")
      .select("*")
      .eq("form_id", form.id)
      .order("order", { ascending: true });

    if (fetchError) throw fetchError;

    const formWithQuestions = {
      ...form,
      createdAt: new Date(form.created_at),
      updatedAt: new Date(form.updated_at),
      isTemplate: form.is_template === true,
      sharingEnabled: form.sharing_enabled === true,
      questions: createdQuestions || [],
    };

    set((state) => ({ forms: [formWithQuestions, ...state.forms] }));

    return formWithQuestions;
  },

  updateForm: async (id, formData) => {
    const { questions, ...formFields } = formData;

    const formToUpdate = {
      ...formFields,
      updated_at: new Date().toISOString(),
      is_template: formFields.is_template ?? false,
      sharing_enabled: formFields.sharing_enabled ?? false,
    };

    const { error: formError } = await supabase
      .from("forms")
      .update(formToUpdate)
      .eq("id", id);

    if (formError) throw formError;

    if (questions) {
      const { error: deleteError } = await supabase
        .from("goform_questions")
        .delete()
        .eq("form_id", id);

      if (deleteError) throw deleteError;

      if (questions.length > 0) {
        const questionsWithFormId = questions.map((question) => ({
          ...question,
          form_id: id,
        }));

        const { error: questionsError } = await supabase
          .from("goform_questions")
          .insert(questionsWithFormId);

        if (questionsError) throw questionsError;
      }
    }

    const { data: updatedQuestions } = await supabase
      .from("goform_questions")
      .select("*")
      .eq("form_id", id)
      .order("order", { ascending: true });

    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === id
          ? {
              ...f,
              ...formFields,
              updatedAt: new Date(),
              isTemplate: formToUpdate.is_template,
              sharingEnabled: formToUpdate.sharing_enabled,
              questions: updatedQuestions || [],
            }
          : f
      ),
    }));
  },

  deleteForm: async (id) => {
    const { error } = await supabase.from("forms").delete().eq("id", id);

    if (error) throw error;

    set((state) => ({
      forms: state.forms.filter((f) => f.id !== id),
    }));
  },

  saveDraft: (form) => {
    const drafts = JSON.parse(localStorage.getItem("formDrafts") || "[]");
    const draftId = form.id || nanoid();
    const updatedForm = { ...form, id: draftId, updatedAt: new Date() };

    const updatedDrafts = drafts.map((d: Form) =>
      d.id === draftId ? updatedForm : d
    );

    if (!drafts.find((d: Form) => d.id === draftId)) {
      updatedDrafts.unshift(updatedForm);
    }

    localStorage.setItem("formDrafts", JSON.stringify(updatedDrafts));
    set({ drafts: updatedDrafts });
  },

  deleteDraft: (id) => {
    const drafts = JSON.parse(localStorage.getItem("formDrafts") || "[]");
    const updatedDrafts = drafts.filter((d: Form) => d.id !== id);
    localStorage.setItem("formDrafts", JSON.stringify(updatedDrafts));
    set({ drafts: updatedDrafts });
  },

  publishForm: async (form) => {
    const { id: draftId, ...formData } = form;
    const formWithId = { ...formData, id: nanoid() };
    await get().createForm(formWithId);
    get().deleteDraft(draftId);
  },

  generateShareLink: async (formId) => {
    const shareLink = `${window.location.origin}/forms/${formId}`;

    const { error } = await supabase
      .from("forms")
      .update({
        sharing_enabled: true,
        share_link: shareLink,
      })
      .eq("id", formId);

    if (error) throw error;

    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === formId ? { ...f, sharingEnabled: true, shareLink } : f
      ),
    }));

    return shareLink;
  },

  addQuestion: async (formId, question) => {
    const { data, error } = await supabase
      .from("goform_questions")
      .insert([{ ...question, form_id: formId }])
      .select()
      .single();

    if (error) throw error;

    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === formId ? { ...f, questions: [...f.questions, data] } : f
      ),
    }));
  },

  updateQuestion: async (formId, questionId, question) => {
    const { error } = await supabase
      .from("goform_questions")
      .update(question)
      .eq("id", questionId);

    if (error) throw error;

    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === formId
          ? {
              ...f,
              questions: f.questions.map((q) =>
                q.id === questionId ? { ...q, ...question } : q
              ),
            }
          : f
      ),
    }));
  },

  deleteQuestion: async (formId, questionId) => {
    const { error } = await supabase
      .from("goform_questions")
      .delete()
      .eq("id", questionId);

    if (error) throw error;

    set((state) => ({
      forms: state.forms.map((f) =>
        f.id === formId
          ? {
              ...f,
              questions: f.questions.filter((q) => q.id !== questionId),
            }
          : f
      ),
    }));
  },
}));
