// import { Injectable, ElementRef } from '@angular/core';
// import html2canvas from 'html2canvas';
// import jsPDF from 'jspdf';
// import { IWidget } from '../entities/IWidget';
// import { PdfExportOptions } from './pdf-export.service';

// /**
//  * Optimized PDF Export Service
//  * Provides non-blocking PDF export functionality with enhanced performance
//  */
// @Injectable({
//   providedIn: 'root'
// })
// export class PdfExportWorkerService {

//   constructor() {
//     console.log('🔧 [WORKER-SERVICE] PdfExportWorkerService initialized');
//   }

//   /**
//    * Export dashboard to PDF with optimized performance
//    * @param dashboardElement - Reference to the dashboard container element
//    * @param widgets - Array of widgets to export
//    * @param options - PDF export configuration options
//    */
//   async exportDashboardToPdf(
//     dashboardElement: ElementRef<HTMLElement>,
//     widgets: IWidget[],
//     options: PdfExportOptions = {}
//   ): Promise<void> {
//     const exportStartTime = performance.now();
//     const startTimestamp = new Date().toLocaleTimeString();
    
//     const {
//       orientation = 'portrait',
//       format = 'a4',
//       margin = 10,
//       filename = 'dashboard-export.pdf',
//       title = 'Dashboard Export',
//       includeHeader = true,
//       includeFooter = true,
//       quality = 1,
//       scale = 2
//     } = options;

//     try {
//       console.log(`🚀 [${startTimestamp}] [WORKER-SERVICE] Starting optimized PDF export with ${widgets.length} widgets...`);
//       console.log(`📊 [WORKER-SERVICE] Export configuration: ${orientation} ${format}, scale=${scale}, quality=${quality}`);
      
//       // Initialize PDF document
//       console.log(`📄 [${new Date().toLocaleTimeString()}] [WORKER-SERVICE] Creating PDF document...`);
//       const pdfStartTime = performance.now();
      
//       const pdf = new jsPDF({
//         orientation,
//         unit: 'mm',
//         format
//       });

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const contentWidth = pageWidth - (margin * 2);
//       const contentHeight = pageHeight - (margin * 2);
//       let currentY = margin;

//       // Add header if requested
//       if (includeHeader) {
//         currentY = this.addHeader(pdf, title, pageWidth, margin, currentY);
//       }

//       const pdfCreateTime = performance.now() - pdfStartTime;
//       console.log(`✅ [WORKER-SERVICE] PDF document created in ${pdfCreateTime.toFixed(2)}ms`);

//       // Process widgets with proper yielding
//       console.log(`🔄 [${new Date().toLocaleTimeString()}] [WORKER-SERVICE] Starting widget processing...`);
//       const widgetProcessingStart = performance.now();
      
//       currentY = await this.processWidgetsOptimized(
//         dashboardElement,
//         widgets,
//         pdf,
//         contentWidth,
//         contentHeight,
//         pageWidth,
//         pageHeight,
//         margin,
//         currentY,
//         quality,
//         scale
//       );
      
//       const widgetProcessingTime = performance.now() - widgetProcessingStart;
//       console.log(`✅ [WORKER-SERVICE] Widget processing completed in ${widgetProcessingTime.toFixed(2)}ms`);

//       // Add footer if requested
//       if (includeFooter) {
//         this.addFooter(pdf, pageWidth, pageHeight, margin);
//       }

//       // Save PDF
//       console.log(`💾 [${new Date().toLocaleTimeString()}] [WORKER-SERVICE] Saving PDF...`);
//       const saveStartTime = performance.now();
      
//       // Use requestAnimationFrame to ensure UI stays responsive during save
//       await new Promise<void>((resolve) => {
//         requestAnimationFrame(() => {
//           pdf.save(filename);
//           resolve();
//         });
//       });
      
//       const saveTime = performance.now() - saveStartTime;

//       const totalTime = performance.now() - exportStartTime;
//       const endTimestamp = new Date().toLocaleTimeString();
      
//       console.log(`🎉 [${endTimestamp}] [WORKER-SERVICE] PDF export completed successfully!`);
//       console.log(`⏱️ [WORKER-SERVICE] Total export time: ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(2)}s)`);
//       console.log(`📈 [WORKER-SERVICE] Performance breakdown:`);
//       console.log(`   - PDF creation: ${pdfCreateTime.toFixed(2)}ms (${((pdfCreateTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - Widget processing: ${widgetProcessingTime.toFixed(2)}ms (${((widgetProcessingTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - PDF save: ${saveTime.toFixed(2)}ms (${((saveTime/totalTime)*100).toFixed(1)}%)`);

//     } catch (error) {
//       const errorTime = performance.now() - exportStartTime;
//       const errorTimestamp = new Date().toLocaleTimeString();
//       console.error(`❌ [${errorTimestamp}] [WORKER-SERVICE] Error exporting dashboard to PDF after ${errorTime.toFixed(2)}ms:`, error);
//       throw new Error('Failed to export dashboard to PDF');
//     }
//   }

//   /**
//    * Process widgets with optimized performance and proper yielding
//    */
//   private async processWidgetsOptimized(
//     dashboardElement: ElementRef<HTMLElement>,
//     widgets: IWidget[],
//     pdf: jsPDF,
//     contentWidth: number,
//     contentHeight: number,
//     pageWidth: number,
//     pageHeight: number,
//     margin: number,
//     initialY: number,
//     quality: number,
//     scale: number
//   ): Promise<number> {
//     let currentY = initialY;

//     for (let i = 0; i < widgets.length; i++) {
//       const widget = widgets[i];
//       const widgetStartTime = performance.now();
      
//       try {
//         console.log(`📊 [${new Date().toLocaleTimeString()}] [WORKER-SERVICE] Processing widget ${i + 1} of ${widgets.length}: ${widget.id}`);
        
//         // Yield control to the UI thread before processing each widget
//         await this.yieldToUI(50);
        
//         // Find the widget element in the DOM
//         const findStart = performance.now();
//         const widgetElement = this.findWidgetElement(dashboardElement, widget.id);
//         const findTime = performance.now() - findStart;
        
//         if (!widgetElement) {
//           console.warn(`⚠️ [WORKER-SERVICE] Widget element not found for ${widget.id} (search took ${findTime.toFixed(2)}ms)`);
//           continue;
//         }

//         console.log(`🔍 [WORKER-SERVICE] Found widget element for ${widget.id} in ${findTime.toFixed(2)}ms`);

//         // Ensure DOM is stable before capturing
//         await this.stabilizeDOM();
        
//         console.log(`📸 [${new Date().toLocaleTimeString()}] [WORKER-SERVICE] Capturing widget ${widget.id} with html2canvas...`);
        
//         // Create canvas from widget element
//         const canvasStart = performance.now();
//         const canvas = await html2canvas(widgetElement, {
//           scale,
//           useCORS: true,
//           allowTaint: true,
//           backgroundColor: '#ffffff',
//           logging: false
//         });
//         const canvasTime = performance.now() - canvasStart;

//         console.log(`✅ [WORKER-SERVICE] Canvas created for widget ${widget.id} in ${canvasTime.toFixed(2)}ms, size: ${canvas.width}x${canvas.height}`);

//         // Convert canvas to image data
//         const imageDataStart = performance.now();
//         const imageData = canvas.toDataURL('image/png', quality);
//         const imageDataTime = performance.now() - imageDataStart;

//         // Add image to PDF
//         const pdfStart = performance.now();
//         currentY = await this.addImageToPdf(
//           pdf,
//           imageData,
//           canvas.width,
//           canvas.height,
//           contentWidth,
//           contentHeight,
//           pageWidth,
//           pageHeight,
//           margin,
//           currentY,
//           widget.id
//         );
//         const pdfTime = performance.now() - pdfStart;
        
//         const widgetTotalTime = performance.now() - widgetStartTime;
        
//         console.log(`✅ [${new Date().toLocaleTimeString()}] [WORKER-SERVICE] Widget ${widget.id} completed in ${widgetTotalTime.toFixed(2)}ms`);
//         console.log(`   📊 [WORKER-SERVICE] Breakdown: Find=${findTime.toFixed(1)}ms, Canvas=${canvasTime.toFixed(1)}ms, ImageData=${imageDataTime.toFixed(1)}ms, PDF=${pdfTime.toFixed(1)}ms`);

//         // Yield control after each widget
//         await this.yieldToUI(25);

//       } catch (error) {
//         const widgetErrorTime = performance.now() - widgetStartTime;
//         console.error(`❌ [WORKER-SERVICE] Error processing widget ${widget.id} after ${widgetErrorTime.toFixed(2)}ms:`, error);
//         // Continue with next widget
//       }
//     }

//     return currentY;
//   }

//   /**
//    * Add image to PDF with proper page management
//    */
//   private async addImageToPdf(
//     pdf: jsPDF,
//     imageData: string,
//     imageWidth: number,
//     imageHeight: number,
//     contentWidth: number,
//     contentHeight: number,
//     pageWidth: number,
//     pageHeight: number,
//     margin: number,
//     currentY: number,
//     widgetId: string
//   ): Promise<number> {
//     // Calculate image dimensions to fit content width
//     const imgWidth = contentWidth;
//     const imgHeight = (imageHeight * imgWidth) / imageWidth;

//     // Add new page if needed
//     if (currentY + imgHeight > contentHeight + margin) {
//       pdf.addPage();
//       currentY = margin;
//       console.log(`🔧 [WORKER-SERVICE] Added new page for widget ${widgetId}`);
//     }

//     // Add image to PDF
//     pdf.addImage(imageData, 'PNG', margin, currentY, imgWidth, imgHeight);
    
//     return currentY + imgHeight + 10; // Add spacing between widgets
//   }

//   /**
//    * Yield control to the UI thread
//    */
//   private async yieldToUI(delay: number = 0): Promise<void> {
//     return new Promise(resolve => {
//       if (delay > 0) {
//         setTimeout(resolve, delay);
//       } else {
//         requestAnimationFrame(() => resolve());
//       }
//     });
//   }

//   /**
//    * Wait for DOM to stabilize
//    */
//   private async stabilizeDOM(): Promise<void> {
//     return new Promise(resolve => {
//       requestAnimationFrame(() => {
//         requestAnimationFrame(() => resolve());
//       });
//     });
//   }

//   /**
//    * Find widget element in the dashboard DOM
//    */
//   private findWidgetElement(
//     dashboardElement: ElementRef<HTMLElement>,
//     widgetId: string
//   ): HTMLElement | null {
//     if (!dashboardElement?.nativeElement) {
//       return null;
//     }

//     // Try to find widget by data attribute
//     const widgetElement = dashboardElement.nativeElement.querySelector(
//       `[data-widget-id="${widgetId}"]`
//     ) as HTMLElement;

//     if (widgetElement) {
//       return widgetElement;
//     }

//     // Fallback: try to find by class name pattern
//     const widgetClass = dashboardElement.nativeElement.querySelector(
//       `.widget-${widgetId}`
//     ) as HTMLElement;

//     if (widgetClass) {
//       return widgetClass;
//     }

//     // Last resort: search for any element containing the widget ID
//     const allElements = dashboardElement.nativeElement.querySelectorAll('*');
//     for (const element of Array.from(allElements)) {
//       if (element.textContent?.includes(widgetId) || 
//           element.className?.includes(widgetId) ||
//           element.id?.includes(widgetId)) {
//         return element as HTMLElement;
//       }
//     }

//     return null;
//   }

//   /**
//    * Add header to PDF
//    */
//   private addHeader(pdf: jsPDF, title: string, pageWidth: number, margin: number, currentY: number): number {
//     // Add title
//     pdf.setFontSize(16);
//     pdf.setFont('helvetica', 'bold');
//     pdf.text(title, pageWidth / 2, currentY + 10, { align: 'center' });
    
//     // Add timestamp
//     pdf.setFontSize(10);
//     pdf.setFont('helvetica', 'normal');
//     const timestamp = `Generated on ${new Date().toLocaleString()}`;
//     pdf.text(timestamp, pageWidth / 2, currentY + 20, { align: 'center' });
    
//     // Add separator line
//     pdf.setDrawColor(200, 200, 200);
//     pdf.line(margin, currentY + 25, pageWidth - margin, currentY + 25);
    
//     return currentY + 35;
//   }

//   /**
//    * Add footer to PDF
//    */
//   private addFooter(pdf: jsPDF, pageWidth: number, pageHeight: number, margin: number): void {
//     const footerY = pageHeight - margin;
    
//     // Add separator line
//     pdf.setDrawColor(200, 200, 200);
//     pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
//     // Add page number
//     pdf.setFontSize(8);
//     pdf.setFont('helvetica', 'normal');
//     const pageNumber = `Page ${pdf.getCurrentPageInfo().pageNumber}`;
//     pdf.text(pageNumber, pageWidth / 2, footerY, { align: 'center' });
//   }

//   /**
//    * Check if Web Workers are supported (for future enhancement)
//    */
//   public isWorkerSupported(): boolean {
//     return typeof Worker !== 'undefined';
//   }
// } 