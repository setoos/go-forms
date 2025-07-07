import React, { ReactNode, useState } from 'react';
import { z } from 'zod';
import { PhoneInput } from 'react-international-phone';
import 'react-international-phone/style.css';
import { toast } from 'react-toastify';

interface ModalProps {
    open: boolean;
    onClose: () => void;
}

const formSchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(8, 'Phone number is required'),
});

export type FormState = {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
};

interface ModalProps {
    open: boolean;
    onClose: () => void;
    setForm: React.Dispatch<React.SetStateAction<FormState>>;
    form: FormState;
}

function Modal({ open, onClose, setForm, form }: ModalProps) {
    const serviceUrl = import.meta.env.VITE_API_BASE_URL || "";
    const mailTo = (import.meta.env.VITE_MAIL_TO || "").split(",").map((e: string) => e.trim()).filter(Boolean);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [submitting, setSubmitting] = useState(false);

    const resetForm = () => {
        setForm({ firstName: '', lastName: '', email: '', phone: '' });
        setErrors({});
        setSubmitting(false);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!open) return null;

    const handleChange = (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

    const handlePhoneChange = (value: string) => {
        setForm((prev) => ({ ...prev, phone: value }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const result = formSchema.safeParse(form);
        if (!result.success) {
            const fieldErrors: Record<string, string> = {};
            result.error.errors.forEach((err) => {
                fieldErrors[err.path[0] as string] = err.message;
            });
            setErrors(fieldErrors);
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            const html = `
                <h2>New Early Access Request</h2>
                <table style='font-size:16px;'>
                  <tr><td><b>First Name:</b></td><td>${form.firstName}</td></tr>
                  <tr><td><b>Last Name:</b></td><td>${form.lastName}</td></tr>
                  <tr><td><b>Email:</b></td><td>${form.email}</td></tr>
                  <tr><td><b>Phone:</b></td><td>${form.phone}</td></tr>
                </table>
            `;

            // Send to all emails in parallel
            const results = await Promise.all(
                mailTo.map(async (mail: string) => {
                    const payload = {
                        to: mail,
                        html,
                        subject: 'New Early Access Request',
                    };
                    const res = await fetch(`${serviceUrl}/send-email`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    });
                    if (!res.ok) throw new Error('Failed to send email to ' + mail);
                    return res;
                })
            );

            setSubmitting(false);
            toast.success("You'll receive an email shortly.");
            resetForm();
            onClose();
        } catch (err) {
            setSubmitting(false);
            toast.error("Something went wrong. Please try again.");
            setErrors({ general: 'Failed to submit. Please try again.' });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-all">
            <div className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-auto animate-fade-in">
                <button
                    className="absolute top-4 right-4 text-gray-400 hover:text-brand-green text-2xl font-bold focus:outline-none"
                    onClick={handleClose}
                    aria-label="Close modal"
                >
                    &times;
                </button>
                <div className="w-full max-w-md mx-auto">
                    <h2 className="text-2xl font-bold text-center mb-6 text-brand-green">Get Started</h2>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <input
                                type="text"
                                placeholder="First Name"
                                className={`w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none bg-white ${errors.firstName ? 'border-red-500' : ''}`}
                                value={form.firstName}
                                onChange={handleChange('firstName')}
                            />
                            {errors.firstName && <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>}
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Last Name"
                                className={`w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none bg-white ${errors.lastName ? 'border-red-500' : ''}`}
                                value={form.lastName}
                                onChange={handleChange('lastName')}
                            />
                            {errors.lastName && <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>}
                        </div>
                        <div>
                            <input
                                type="email"
                                placeholder="Business Email"
                                className={`w-full px-4 py-3 rounded-xl border border-brand-green/20 focus:border-brand-green focus:ring-2 focus:ring-brand-green/20 outline-none bg-white ${errors.email ? 'border-red-500' : ''}`}
                                value={form.email}
                                onChange={handleChange('email')}
                            />
                            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <PhoneInput
                                defaultCountry="in"
                                value={form.phone}
                                onChange={handlePhoneChange}
                                className="w-full min-h-[48px] flex items-center"
                                inputClassName="!w-full !h-[48px] !px-4 !py-3 !border !border-brand-green/20 focus:!border-brand-green focus:!ring-2 focus:!ring-brand-green/20 !outline-none !bg-white !text-base !placeholder-gray-400 !rounded-tr-xl !rounded-br-xl"
                                placeholder="Phone Number"
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                        <div className="flex justify-center w-full">
                            <button type="submit" className="btn-primary w-full px-8 py-3 rounded-xl text-lg font-semibold flex items-center justify-center" disabled={submitting}>
                                {submitting ? 'Submitting...' : 'Get Early Access'}
                            </button>
                        </div>
                        {errors.general && <p className="text-xs text-red-500 text-center mt-2">{errors.general}</p>}
                        {/* <p className="text-xs text-gray-500 text-center mt-2">By submitting your information, you agree to GoForms' <a href="#" className="underline text-brand-green">Privacy Policy</a>. You can opt out anytime.</p> */}
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Modal
