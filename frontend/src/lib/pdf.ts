import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { QuizResponse } from '../types/quiz';
import { supabase } from './supabase';
import { processTemplateVariables } from './htmlSanitizer';
import { Parser } from 'htmlparser2';

export async function generatePDF(response: QuizResponse, returnBlob = false): Promise<Blob | void> {
  try {
    // Get template if quiz_id is provided
    let templateContent = '';
    let templateSections = null;

    if (response.quiz_id && response.quiz_id !== 'preview' && response.quiz_id !== 'sample') {
      // First try to get a quiz-specific template
      const { data: quizTemplate } = await supabase
        .from('report_templates')
        .select('content')
        .eq('quiz_id', response.quiz_id)
        .eq('is_default', true)
        .maybeSingle();

      // If no quiz-specific template, try to get a global default
      if (!quizTemplate) {
        const { data: globalTemplate } = await supabase
          .from('report_templates')
          .select('content')
          .is('quiz_id', null)
          .eq('is_default', true)
          .maybeSingle();

        if (globalTemplate) {
          templateContent = globalTemplate.content;
        }
      } else {
        templateContent = quizTemplate.content;
      }
      // If we have template content, try to parse it
      if (templateContent) {
        try {
          templateSections = JSON.parse(templateContent);
        } catch (e) {
          // If parsing fails, use the content as is
          templateContent = templateContent;
        }
      }
    }

    // Use custom feedback if provided
    if (response.custom_feedback) {
      templateContent = response.custom_feedback;
    }

    // Get question details and option feedback
    let questionDetails = [];
    if (response.quiz_id && response.quiz_id !== 'preview' && response.quiz_id !== 'sample') {
      const { data: questions } = await supabase
        .from('questions')
        .select(`
          id,
          text,
          type,
          options (
            id,
            text,
            is_correct,
            feedback,
            score
          ),
          points,
          tf_feedback,
          is_hide
        `)
        .eq('quiz_id', response.quiz_id)
        .order('order');

      if (questions) {
        questionDetails = questions;
      }
    }

    return new Promise(async (resolve) => {
      // Create new PDF document with better quality settings
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
        putOnlyUsedFonts: true,
        floatPrecision: 16 // For better rendering quality
      });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPos = 20;

      // Add logo and header with better styling
      doc.setFillColor(147, 51, 234); // Purple color
      doc.rect(0, 0, pageWidth, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('Quiz Results Report', margin, 25);
      yPos = 50;

      // Add page number function with better formatting
      const addPageNumber = (pageNumber: number, totalPages: number) => {
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
      };

      // Add first page number
      addPageNumber(1, 1); // Will update total pages at the end

      // User Info with better layout
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Participant Information', margin, yPos);
      yPos += 10;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.text(`Name: ${response.name}`, margin, yPos);
      yPos += 8;
      doc.text(`Email: ${response.email}`, margin, yPos);
      yPos += 8;
      if (response.phone) {
        doc.text(`Phone: ${response.phone}`, margin, yPos);
        yPos += 8;
      }
      doc.text(`Date: ${new Date(response.timestamp || Date.now()).toLocaleDateString()}`, margin, yPos);
      yPos += 15;

      // Score Summary with improved styling
      doc.setFillColor(245, 243, 255); // Light purple background
      doc.rect(margin, yPos, pageWidth - (margin * 2), 40, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('Score Summary', margin + 5, yPos + 15);

      doc.setFontSize(24);
      doc.setTextColor(147, 51, 234); // Purple color
      const percentage = response.score;
      doc.text(
        `${Number.isInteger(percentage) ? percentage : percentage.toFixed(2)}%`,
        pageWidth - margin - 30,
        yPos + 25
      );

      yPos += 50;

      // Get performance category based on score
      const getPerformanceCategory = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 80) return 'Very Good';
        if (score >= 70) return 'Good';
        if (score >= 60) return 'Satisfactory';
        return 'Needs Improvement';
      };

      // Process template content
      if (templateSections && Array.isArray(templateSections)) {
        // Process sections
        for (const section of templateSections) {
          // Check if we need a new page
          if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
            addPageNumber(doc.getNumberOfPages(), 1);
          }

          // Add section title
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text(section.title, margin, yPos);
          yPos += 10;

          // Process section content - replace variables
          let processedContent = processTemplateVariables(section.content, {
            name: response.name,
            email: response.email,
            score: response.score.toString(),
            date: new Date(response.timestamp || Date.now()).toLocaleDateString(),
            time: `${Math.floor((response.completion_time || 0) / 60)}:${String((response.completion_time || 0) % 60).padStart(2, '0')}`,
            quiz_title: 'Quiz',
            performance_category: getPerformanceCategory(response.score)
          });

          // Create a temporary div to parse HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = processedContent;

          // Extract images
          const images = tempDiv.querySelectorAll('img');
          const imagePromises: Promise<void>[] = [];
          const imageData: Record<string, { url: string, x: number, y: number, width: number, height: number }> = {};

          // Process each image
          images.forEach((img, index) => {
            const src = img.getAttribute('src');
            if (src) {
              // Create a placeholder in the content
              const imgPlaceholder = `[IMAGE_${index}]`;
              imageData[imgPlaceholder] = {
                url: src,
                x: margin,
                y: 0, // Will be set later
                width: 0, // Will be calculated based on aspect ratio
                height: 0 // Will be calculated based on aspect ratio
              };

              // Replace the image with a placeholder
              img.outerHTML = imgPlaceholder;

              // Load the image to get dimensions
              const promise = new Promise<void>((resolve) => {
                const imgObj = new Image();
                imgObj.onload = function () {
                  // Calculate dimensions to fit within page width
                  const maxWidth = pageWidth - (margin * 2);
                  const aspectRatio = imgObj.height / imgObj.width;

                  const width = Math.min(maxWidth, imgObj.width);
                  const height = width * aspectRatio;

                  imageData[imgPlaceholder].width = width;
                  imageData[imgPlaceholder].height = height;

                  resolve();
                };
                imgObj.onerror = function () {
                  console.error('Error loading image:', src);
                  resolve();
                };
                imgObj.src = src;
              });

              imagePromises.push(promise);
            }
          });

          // Wait for all images to load
          await Promise.all(imagePromises);

          // Get text content
          const textContent = tempDiv.textContent || '';

          // Split text into lines that fit the page width
          const textLines = doc.splitTextToSize(textContent, pageWidth - (margin * 2));

          // Process text and images
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(12);

          for (let i = 0; i < textLines.length; i++) {
            const line = textLines[i];

            // Check if we need a new page
            if (yPos > pageHeight - 20) {
              doc.addPage();
              yPos = 20;
              addPageNumber(doc.getNumberOfPages(), 1);
            }

            // Check if line contains an image placeholder
            const imgPlaceholderMatch = line.match(/\[IMAGE_(\d+)\]/);
            if (imgPlaceholderMatch) {
              const imgPlaceholder = imgPlaceholderMatch[0];
              const imgData = imageData[imgPlaceholder];

              if (imgData) {
                // Add text before the image
                const textBeforeImg = line.split(imgPlaceholder)[0];
                if (textBeforeImg.trim()) {
                  doc.text(textBeforeImg, margin, yPos);
                  yPos += 8;
                }

                // Check if image fits on current page
                if (yPos + imgData.height > pageHeight - 20) {
                  doc.addPage();
                  yPos = 20;
                  addPageNumber(doc.getNumberOfPages(), 1);
                }

                // Add the image
                try {
                  imgData.y = yPos;
                  doc.addImage(
                    imgData.url,
                    'JPEG',
                    imgData.x,
                    imgData.y,
                    imgData.width,
                    imgData.height
                  );

                  yPos += imgData.height + 10;
                } catch (e) {
                  console.error('Error adding image to PDF:', e);
                }

                // Add text after the image
                const textAfterImg = line.split(imgPlaceholder)[1];
                if (textAfterImg && textAfterImg.trim()) {
                  doc.text(textAfterImg, margin, yPos);
                  yPos += 8;
                }
              } else {
                // If image data not found, just add the line
                doc.text(line, margin, yPos);
                yPos += 8;
              }
            } else {
              // Regular text line
              doc.text(line, margin, yPos);
              yPos += 8;
            }
          }

          yPos += 10; // Add space after section
        }
      } else if (templateContent) {
        // Process single content block
        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
          addPageNumber(doc.getNumberOfPages(), 1);
        }

        // Add title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Feedback & Recommendations', margin, yPos);
        yPos += 10;

        // Process content - replace variables
        let processedContent = processTemplateVariables(templateContent, {
          name: response.name,
          email: response.email,
          score: response.score.toString(),
          date: new Date(response.timestamp || Date.now()).toLocaleDateString(),
          time: `${Math.floor((response.completion_time || 0) / 60)}:${String((response.completion_time || 0) % 60).padStart(2, '0')}`,
          quiz_title: 'Quiz',
          performance_category: getPerformanceCategory(response.score)
        });

        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedContent;

        // Extract images
        const images = tempDiv.querySelectorAll('img');
        const imagePromises: Promise<void>[] = [];
        const imageData: Record<string, { url: string, x: number, y: number, width: number, height: number }> = {};

        // Process each image
        images.forEach((img, index) => {
          const src = img.getAttribute('src');
          if (src) {
            // Create a placeholder in the content
            const imgPlaceholder = `[IMAGE_${index}]`;
            imageData[imgPlaceholder] = {
              url: src,
              x: margin,
              y: 0, // Will be set later
              width: 0, // Will be calculated based on aspect ratio
              height: 0 // Will be calculated based on aspect ratio
            };

            // Replace the image with a placeholder
            img.outerHTML = imgPlaceholder;

            // Load the image to get dimensions
            const promise = new Promise<void>((resolve) => {
              const imgObj = new Image();
              imgObj.onload = function () {
                // Calculate dimensions to fit within page width
                const maxWidth = pageWidth - (margin * 2);
                const aspectRatio = imgObj.height / imgObj.width;

                const width = Math.min(maxWidth, imgObj.width);
                const height = width * aspectRatio;

                imageData[imgPlaceholder].width = width;
                imageData[imgPlaceholder].height = height;

                resolve();
              };
              imgObj.onerror = function () {
                console.error('Error loading image:', src);
                resolve();
              };
              imgObj.src = src;
            });

            imagePromises.push(promise);
          }
        });

        // Wait for all images to load
        await Promise.all(imagePromises);

        // Get text content
        const textContent = tempDiv.textContent || '';

        // Split text into lines that fit the page width
        const textLines = doc.splitTextToSize(textContent, pageWidth - (margin * 2));

        // Process text and images
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);

        for (let i = 0; i < textLines.length; i++) {
          const line = textLines[i];

          // Check if we need a new page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
            addPageNumber(doc.getNumberOfPages(), 1);
          }

          // Check if line contains an image placeholder
          const imgPlaceholderMatch = line.match(/\[IMAGE_(\d+)\]/);
          if (imgPlaceholderMatch) {
            const imgPlaceholder = imgPlaceholderMatch[0];
            const imgData = imageData[imgPlaceholder];

            if (imgData) {
              // Add text before the image
              const textBeforeImg = line.split(imgPlaceholder)[0];
              if (textBeforeImg.trim()) {
                doc.text(textBeforeImg, margin, yPos);
                yPos += 8;
              }

              // Check if image fits on current page
              if (yPos + imgData.height > pageHeight - 20) {
                doc.addPage();
                yPos = 20;
                addPageNumber(doc.getNumberOfPages(), 1);
              }

              // Add the image
              try {
                imgData.y = yPos;
                doc.addImage(
                  imgData.url,
                  'JPEG',
                  imgData.x,
                  imgData.y,
                  imgData.width,
                  imgData.height
                );

                yPos += imgData.height + 10;
              } catch (e) {
                console.error('Error adding image to PDF:', e);
              }

              // Add text after the image
              const textAfterImg = line.split(imgPlaceholder)[1];
              if (textAfterImg && textAfterImg.trim()) {
                doc.text(textAfterImg, margin, yPos);
                yPos += 8;
              }
            } else {
              // If image data not found, just add the line
              doc.text(line, margin, yPos);
              yPos += 8;
            }
          } else {
            // Regular text line
            doc.text(line, margin, yPos);
            yPos += 8;
          }
        }
      } else {
        // Default content if no template is found
        // Performance Analysis
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Performance Analysis', margin, yPos);
        yPos += 10;

        const analysis = getScoreAnalysis(response.score);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');

        const splitAnalysis = doc.splitTextToSize(analysis, pageWidth - (margin * 2));
        doc.text(splitAnalysis, margin, yPos);
        yPos += splitAnalysis.length * 8 + 15;
      }

      // Check if we need a new page for Question Breakdown
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 20;
        addPageNumber(doc.getNumberOfPages(), 1); // Will update total pages at the end
      }

      // Question Breakdown with better styling
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Question Breakdown', margin, yPos);
      yPos += 10;

      // -----------------*************------------------*******************-----------------************* 
      // -----------------*************------------------*******************-----------------*************  
      // -----------------*************------------------*******************-----------------*************   

      // Create table data
      // const tableData = Object.entries(response.answers || {}).map(([questionId, answerData], index) => {
      //   // Find the question
      //   const question = questionDetails.find(q => q.id === questionId);
      //   const questionText = question ? question.text : `${index + 1}`;

      //   // Get the score - either directly from the answer or from the option
      //   // let score = 0;
      //   // if (typeof answerData === 'number') {
      //   //   score = answerData;
      //   // } else if (typeof answerData === 'object' && answerData.optionId) {
      //   //   const option = question?.options?.find(o => o.id === answerData.optionId);
      //   //   if (option) {
      //   //     score = option.score;
      //   //   }
      //   // }
      //   let score = 0;

      //   if (typeof answerData === 'object' && typeof answerData.value === 'number') {
      //     score = answerData.value;
      //   }

      //   const impactAnalysisHtml = answerData?.impact_analysis || '';
      //   const impactAnalysis = stripHtml(impactAnalysisHtml);


      //   return [
      //     `${index + 1}`,
      //     questionText,
      //     `${score}/10`,
      //     getScoreCategory(score),
      //     impactAnalysis
      //   ];
      // });



      yPos = 250; // Starting Y position

      function renderHtmlToPDF(html: string, doc: jsPDF, x: number, y: number, maxWidth = 80) {
        let cursorY = y;

        const parser = new Parser({
          onopentag(name, attribs) {
            if (name === 'strong' || name === 'b') {
              doc.setFont('helvetica', 'bold');
            } else if (name === 'h2') {
              doc.setFontSize(13);
              doc.setFont('helvetica', 'bold');
            } else if (name === 'p') {
              cursorY += 5;
            }
          },
          ontext(text) {
            const lines = doc.splitTextToSize(text.trim(), maxWidth);
            doc.text(lines, x, cursorY);
            cursorY += lines.length * 5;
          },
          onclosetag(name) {
            if (name === 'strong' || name === 'b' || name === 'h2') {
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(10);
            }
          },
        }, { decodeEntities: true });

        parser.write(html);
        parser.end();

        return cursorY;
      }

      Object.entries(response.answers || {}).forEach(([questionId, answerData], index) => {
        const question = questionDetails.find(q => q.id === questionId);
        const questionText = question?.text || `Question ${index + 1}`;
        const optionText = question?.options?.find(o => o.score === answerData?.value)?.text || '';
        const points = questionDetails.find(q => q.id === questionId)?.points || 10;

        const score = typeof answerData === 'object' && typeof answerData.value === 'number'
          ? answerData.value
          : 0;

        const impactAnalysis = answerData?.impact_analysis || '';
        const fallbackText = 'No Impact Analysis Available';
        const impactText = impactAnalysis ? impactAnalysis : `<p>${fallbackText}</p>`;

        function estimateHtmlHeight(html: string, doc: jsPDF, maxWidth = 80): number {
          let height = 0;

          const parser = new Parser({
            onopentag(name) {
              if (name === 'p') {
                height += 5;
              } else if (name === 'h2') {
                height += 7;
              }
            },
            ontext(text) {
              const lines = doc.splitTextToSize(text.trim(), maxWidth);
              height += lines.length * 5;
            },
          }, { decodeEntities: true });

          parser.write(html);
          parser.end();

          return height;
        }

        const impactAnalysisHeight = estimateHtmlHeight(impactAnalysis, doc, 80);
        // Sum of all heights for the section
        const sectionHeight = impactAnalysisHeight > 80 ? impactAnalysisHeight : 80;

        if (yPos + sectionHeight > 280) {
          doc.addPage();
          yPos = 20;
          addPageNumber(doc.getNumberOfPages(), 1);
        }

        // Section background
        doc.setFillColor(250, 250, 255);
        doc.roundedRect(15, yPos - 5, 180, sectionHeight, 3, 3, 'F');

        // Question Title
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 50, 20);
        doc.text(`Question ${index + 1}`, 20, yPos + 5);

        // Question Text
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(33, 33, 33);
        const questionLines = doc.splitTextToSize(questionText, 170);
        doc.text(questionLines, 20, yPos + 12);
        yPos += 12 + questionLines.length * 5;

        // User Answer
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(147, 51, 234);
        doc.text('Your Answer - option A', 20, yPos);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        const answerLines = doc.splitTextToSize(optionText, 160);
        doc.text(answerLines, 20, yPos + 6);
        yPos += 10 + answerLines.length * 5;

        // Draw vertical line to split left (Impact) and right (Score)
        const splitY = yPos + 5;
        const colTop = splitY;
        const colHeight = 30;
        const colMid = 105;

        doc.setDrawColor(160, 120, 40);
        doc.line(colMid, colTop, colMid, colTop + colHeight);



        // Impact Analysis (left side)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(184, 134, 11);
        doc.text('Impact Analysis', 20, splitY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        const newY = renderHtmlToPDF(impactText, doc, 20, splitY + 7, 80);
        yPos = newY + 10;

        // Score & Performance (right side)
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(184, 134, 11);
        doc.text('Score & Performance', colMid + 5, splitY);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(`Score: ${score}/${points}`, colMid + 5, splitY + 7);
        doc.text(`Performance: ${getScoreCategory(score)}`, colMid + 5, splitY + 14);

        // Horizontal line divider after each question
        doc.setDrawColor(160, 120, 40); // optional: match with theme
        doc.setLineWidth(0.5);
        doc.line(20, yPos + 5, 190, yPos + 5);
        yPos += 20; // spacing before next question

      });





      // -----------------*************------------------*******************-----------------************* 
      // -----------------*************------------------*******************-----------------*************  
      // -----------------*************------------------*******************-----------------*************   





      // // Add table with improved styling
      // autoTable(doc, {
      //   startY: yPos,
      //   head: [['#', 'Question', 'Score', 'Performance', 'Analysis']],
      //   body: tableData,
      //   theme: 'striped',
      //   headStyles: {
      //     fillColor: [147, 51, 234],
      //     textColor: [255, 255, 255],
      //     fontStyle: 'bold',
      //     halign: 'center'
      //   },
      //   columnStyles: {
      //     0: { cellWidth: 15, halign: 'center' },
      //     1: { cellWidth: 70 },
      //     2: { cellWidth: 20, halign: 'center' },
      //     3: { cellWidth: 30, halign: 'center' },
      //     4: { cellWidth: 50 }
      //   },
      //   alternateRowStyles: {
      //     fillColor: [245, 243, 255]
      //   },
      //   margin: { top: 10, right: margin, bottom: 10, left: margin },
      //   styles: {
      //     font: 'helvetica',
      //     overflow: 'linebreak',
      //     cellPadding: 5
      //   }
      // });

      // Get the Y position after the table
      yPos = (doc as any).lastAutoTable?.finalY + 20;

      // Add option feedback for each question if available
      for (const [questionId, answer] of Object.entries(response.answers || {})) {
        // Find the question
        const question = questionDetails.find(q => q.id === questionId);
        if (!question || question.type !== 'multiple_choice') continue;

        // Find the selected option
        const optionId = typeof answer === 'object' && answer.optionId ? answer.optionId : null;
        if (!optionId) continue;

        const option = question.options?.find(o => o.id === optionId);
        if (!option || !option.feedback) continue;

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
          doc.addPage();
          yPos = 20;
          addPageNumber(doc.getNumberOfPages(), 1);
        }

        // Add option feedback title
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Feedback for Question ${questionDetails.indexOf(question) + 1}: ${question.text.substring(0, 50)}${question.text.length > 50 ? '...' : ''}`, margin, yPos);
        yPos += 8;

        // Add score information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(`Score: ${option.score}/${option.points}`, margin, yPos);
        yPos += 6;

        // Process feedback content - replace variables
        let processedFeedback = processTemplateVariables(option.feedback, {
          name: response.name,
          email: response.email,
          score: response.score.toString(),
          date: new Date(response.timestamp || Date.now()).toLocaleDateString(),
          time: `${Math.floor((response.completion_time || 0) / 60)}:${String((response.completion_time || 0) % 60).padStart(2, '0')}`,
          quiz_title: 'Quiz',
          performance_category: getPerformanceCategory(response.score)
        });

        // Create a temporary div to parse HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedFeedback;

        // Extract images
        const images = tempDiv.querySelectorAll('img');
        const imagePromises: Promise<void>[] = [];
        const imageData: Record<string, { url: string, x: number, y: number, width: number, height: number }> = {};

        // Process each image
        images.forEach((img, index) => {
          const src = img.getAttribute('src');
          if (src) {
            // Create a placeholder in the content
            const imgPlaceholder = `[IMAGE_FEEDBACK_${index}]`;
            imageData[imgPlaceholder] = {
              url: src,
              x: margin,
              y: 0, // Will be set later
              width: 0, // Will be calculated based on aspect ratio
              height: 0 // Will be calculated based on aspect ratio
            };

            // Replace the image with a placeholder
            img.outerHTML = imgPlaceholder;

            // Load the image to get dimensions
            const promise = new Promise<void>((resolve) => {
              const imgObj = new Image();
              imgObj.onload = function () {
                // Calculate dimensions to fit within page width
                const maxWidth = pageWidth - (margin * 2);
                const aspectRatio = imgObj.height / imgObj.width;

                const width = Math.min(maxWidth, imgObj.width);
                const height = width * aspectRatio;

                imageData[imgPlaceholder].width = width;
                imageData[imgPlaceholder].height = height;

                resolve();
              };
              imgObj.onerror = function () {
                console.error('Error loading image:', src);
                resolve();
              };
              imgObj.src = src;
            });

            imagePromises.push(promise);
          }
        });

        // Wait for all images to load
        await Promise.all(imagePromises);

        // Get text content
        const textContent = tempDiv.textContent || '';

        // Split text into lines that fit the page width
        const textLines = doc.splitTextToSize(textContent, pageWidth - (margin * 2));

        // Process text and images
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        for (let i = 0; i < textLines.length; i++) {
          const line = textLines[i];

          // Check if we need a new page
          if (yPos > pageHeight - 20) {
            doc.addPage();
            yPos = 20;
            addPageNumber(doc.getNumberOfPages(), 1);
          }

          // Check if line contains an image placeholder
          const imgPlaceholderMatch = line.match(/\[IMAGE_FEEDBACK_(\d+)\]/);
          if (imgPlaceholderMatch) {
            const imgPlaceholder = imgPlaceholderMatch[0];
            const imgData = imageData[imgPlaceholder];

            if (imgData) {
              // Add text before the image
              const textBeforeImg = line.split(imgPlaceholder)[0];
              if (textBeforeImg.trim()) {
                doc.text(textBeforeImg, margin, yPos);
                yPos += 6;
              }

              // Check if image fits on current page
              if (yPos + imgData.height > pageHeight - 20) {
                doc.addPage();
                yPos = 20;
                addPageNumber(doc.getNumberOfPages(), 1);
              }

              // Add the image
              try {
                imgData.y = yPos;
                doc.addImage(
                  imgData.url,
                  'JPEG',
                  imgData.x,
                  imgData.y,
                  imgData.width,
                  imgData.height
                );

                yPos += imgData.height + 8;
              } catch (e) {
                console.error('Error adding image to PDF:', e);
              }

              // Add text after the image
              const textAfterImg = line.split(imgPlaceholder)[1];
              if (textAfterImg && textAfterImg.trim()) {
                doc.text(textAfterImg, margin, yPos);
                yPos += 6;
              }
            } else {
              // If image data not found, just add the line
              doc.text(line, margin, yPos);
              yPos += 6;
            }
          } else {
            // Regular text line
            doc.text(line, margin, yPos);
            yPos += 6;
          }
        }

        yPos += 10; // Add space after feedback
      }

      // Update page numbers for all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(128, 128, 128);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - 40, pageHeight - 10);
        doc.text('Generated by GoForms Quiz System', margin, pageHeight - 10);
      }

      // Set PDF properties for better metadata
      doc.setProperties({
        title: `Quiz Results - ${response.name}`,
        subject: 'Quiz Assessment Results',
        author: 'GoForms Quiz System',
        keywords: 'quiz, assessment, results',
        creator: 'GoForms'
      });

      // Optimize PDF
      const pdfOptions = {
        compress: true,
        precision: 2,
        userUnit: 1.0
      };

      if (returnBlob) {
        const blob = doc.output('blob', pdfOptions);
        resolve(blob);
      } else {
        const filename = `quiz-results-${response.id || new Date().getTime()}.pdf`;
        doc.save(filename);
        resolve();
      }
    });
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

function getScoreAnalysis(score: number): string {
  if (score >= 90) {
    return 'Outstanding performance! You have demonstrated exceptional understanding of the subject matter. Your responses show a comprehensive grasp of key concepts and their practical applications. Your ability to apply knowledge effectively puts you in the top tier of participants.';
  } else if (score >= 80) {
    return 'Excellent work! You have shown strong knowledge across most areas. Your understanding of core concepts is solid, with only minor gaps in a few areas. Consider reviewing the few questions you missed to achieve mastery of the subject.';
  } else if (score >= 70) {
    return 'Good job! You have achieved a solid understanding of the core concepts. Your performance demonstrates competence in most areas, though there are some specific topics where you could strengthen your knowledge. Focus on the areas where you scored lower to improve your overall expertise.';
  } else if (score >= 60) {
    return 'Fair performance. While you have grasped some key concepts, there is room for improvement in several areas. Consider reviewing the material more thoroughly and trying again to strengthen your understanding of the fundamental principles.';
  } else {
    return 'This assessment indicates areas needing additional focus. Your current understanding of the subject matter shows significant gaps that should be addressed. We recommend reviewing the material comprehensively and attempting the quiz again to strengthen your knowledge base.';
  }
}

function getScoreCategory(score: number): string {
  if (score >= 9) return 'Excellent';
  if (score >= 7) return 'Good';
  if (score >= 5) return 'Average';
  if (score >= 3) return 'Below Average';
  return 'Poor';
}