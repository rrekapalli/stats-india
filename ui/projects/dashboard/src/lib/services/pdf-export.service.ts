// import { Injectable, ElementRef } from '@angular/core';
// import jsPDF from 'jspdf';
// import html2canvas from 'html2canvas';
// import { IWidget } from '../entities/IWidget';

// /**
//  * Configuration options for PDF export functionality
//  */
// export interface PdfExportOptions {
//   /** Page orientation for the PDF */
//   orientation?: 'portrait' | 'landscape';
//   /** Page format/size for the PDF */
//   format?: 'a4' | 'a3' | 'letter' | 'legal';
//   /** Margin size in millimeters */
//   margin?: number;
//   /** Output filename for the PDF */
//   filename?: string;
//   /** Title to display in the PDF header */
//   title?: string;
//   /** Whether to include a header in the PDF */
//   includeHeader?: boolean;
//   /** Whether to include a footer in the PDF */
//   includeFooter?: boolean;
//   /** Image quality for chart captures (0-1) */
//   quality?: number;
//   /** Scale factor for chart captures */
//   scale?: number;
// }

// /**
//  * Service for exporting dashboard widgets to PDF format
//  * Supports both basic and intelligent layout algorithms
//  */
// @Injectable({
//   providedIn: 'root'
// })
// export class PdfExportService {

//   /**
//    * Export dashboard to PDF using basic layout algorithm
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
//       console.log(`🚀 [${startTimestamp}] Starting PDF export with ${widgets.length} widgets...`);
//       console.log(`📊 Export configuration: ${orientation} ${format}, scale=${scale}, quality=${quality}`);
      
//       // Shorter wait for chart rendering - original was too long
//       console.log(`⏳ [${new Date().toLocaleTimeString()}] Waiting for charts to render...`);
//       const renderWaitStart = performance.now();
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       const renderWaitTime = performance.now() - renderWaitStart;
//       console.log(`✅ Chart rendering wait completed in ${renderWaitTime.toFixed(2)}ms`);

//       // Create PDF document with specified settings
//       console.log(`📄 [${new Date().toLocaleTimeString()}] Creating PDF document...`);
//       const pdfCreateStart = performance.now();
//       const pdf = new jsPDF({
//         orientation,
//         unit: 'mm',
//         format
//       });
//       const pdfCreateTime = performance.now() - pdfCreateStart;

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const contentWidth = pageWidth - (margin * 2);
//       const contentHeight = pageHeight - (margin * 2);
      
//       console.log(`✅ PDF document created in ${pdfCreateTime.toFixed(2)}ms (${pageWidth}x${pageHeight}mm, content: ${contentWidth}x${contentHeight}mm)`);

//       let currentY = margin;

//       // Add header if requested
//       if (includeHeader) {
//         console.log(`📋 [${new Date().toLocaleTimeString()}] Adding header...`);
//         const headerStart = performance.now();
//         currentY = this.addHeader(pdf, title, pageWidth, margin, currentY);
//         const headerTime = performance.now() - headerStart;
//         console.log(`✅ Header added in ${headerTime.toFixed(2)}ms`);
//       }

//       // Export widgets using basic layout
//       console.log(`🔄 [${new Date().toLocaleTimeString()}] Starting widget export process...`);
//       const widgetsStart = performance.now();
//       currentY = await this.exportWidgets(
//         pdf,
//         dashboardElement,
//         widgets,
//         contentWidth,
//         contentHeight,
//         margin,
//         currentY,
//         quality,
//         scale
//       );
//       const widgetsTime = performance.now() - widgetsStart;
//       console.log(`✅ Widget export completed in ${widgetsTime.toFixed(2)}ms`);

//       // Add footer if requested
//       if (includeFooter) {
//         console.log(`📄 [${new Date().toLocaleTimeString()}] Adding footer...`);
//         const footerStart = performance.now();
//         this.addFooter(pdf, pageWidth, pageHeight, margin);
//         const footerTime = performance.now() - footerStart;
//         console.log(`✅ Footer added in ${footerTime.toFixed(2)}ms`);
//       }

//       // Save the PDF file
//       console.log(`💾 [${new Date().toLocaleTimeString()}] Saving PDF as: ${filename}`);
//       const saveStart = performance.now();
//       pdf.save(filename);
//       const saveTime = performance.now() - saveStart;
      
//       const totalTime = performance.now() - exportStartTime;
//       const endTimestamp = new Date().toLocaleTimeString();
      
//       console.log(`✅ PDF saved in ${saveTime.toFixed(2)}ms`);
//       console.log(`🎉 [${endTimestamp}] PDF export completed successfully!`);
//       console.log(`⏱️ Total export time: ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(2)}s)`);
//       console.log(`📈 Performance breakdown:`);
//       console.log(`   - Render wait: ${renderWaitTime.toFixed(2)}ms (${((renderWaitTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - PDF creation: ${pdfCreateTime.toFixed(2)}ms (${((pdfCreateTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - Widget processing: ${widgetsTime.toFixed(2)}ms (${((widgetsTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - Save operation: ${saveTime.toFixed(2)}ms (${((saveTime/totalTime)*100).toFixed(1)}%)`);

//     } catch (error) {
//       const errorTime = performance.now() - exportStartTime;
//       const errorTimestamp = new Date().toLocaleTimeString();
//       console.error(`❌ [${errorTimestamp}] Error exporting dashboard to PDF after ${errorTime.toFixed(2)}ms:`, error);
//       throw new Error('Failed to export dashboard to PDF');
//     }
//   }

//   /**
//    * Export dashboard to PDF using intelligent layout algorithm
//    * Attempts to preserve widget positioning and relationships
//    * @param dashboardElement - Reference to the dashboard container element
//    * @param widgets - Array of widgets to export
//    * @param options - PDF export configuration options
//    */
//   async exportDashboardToPdfIntelligent(
//     dashboardElement: ElementRef<HTMLElement>,
//     widgets: IWidget[],
//     options: PdfExportOptions = {}
//   ): Promise<void> {
//     const exportStartTime = performance.now();
//     const startTimestamp = new Date().toLocaleTimeString();
    
//     const {
//       orientation = 'landscape',
//       format = 'a4',
//       margin = 15,
//       filename = 'dashboard-export.pdf',
//       title = 'Dashboard Export',
//       includeHeader = true,
//       includeFooter = true,
//       quality = 1,
//       scale = 3 // Higher scale for better quality
//     } = options;

//     try {
//       console.log(`🚀 [${startTimestamp}] [INTELLIGENT] Starting PDF export with ${widgets.length} widgets...`);
//       console.log(`📊 [INTELLIGENT] Export configuration: ${orientation} ${format}, scale=${scale}, quality=${quality}`);
      
//       // Shorter wait for chart rendering - original was too long
//       console.log(`⏳ [${new Date().toLocaleTimeString()}] [INTELLIGENT] Waiting for charts to render...`);
//       const renderWaitStart = performance.now();
//       await new Promise(resolve => setTimeout(resolve, 1000));
//       const renderWaitTime = performance.now() - renderWaitStart;
//       console.log(`✅ [INTELLIGENT] Chart rendering wait completed in ${renderWaitTime.toFixed(2)}ms`);

//       // Create PDF document with specified settings
//       console.log(`📄 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Creating PDF document...`);
//       const pdfCreateStart = performance.now();
//       const pdf = new jsPDF({
//         orientation,
//         unit: 'mm',
//         format
//       });
//       const pdfCreateTime = performance.now() - pdfCreateStart;

//       const pageWidth = pdf.internal.pageSize.getWidth();
//       const pageHeight = pdf.internal.pageSize.getHeight();
//       const contentWidth = pageWidth - (margin * 2);
//       const contentHeight = pageHeight - (margin * 2);
      
//       console.log(`✅ [INTELLIGENT] PDF document created in ${pdfCreateTime.toFixed(2)}ms (${pageWidth}x${pageHeight}mm, content: ${contentWidth}x${contentHeight}mm)`);

//       let currentY = margin;

//       // Add header if requested
//       if (includeHeader) {
//         console.log(`📋 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Adding header...`);
//         const headerStart = performance.now();
//         currentY = this.addHeader(pdf, title, pageWidth, margin, currentY);
//         const headerTime = performance.now() - headerStart;
//         console.log(`✅ [INTELLIGENT] Header added in ${headerTime.toFixed(2)}ms`);
//       }

//       // Export widgets using intelligent layout
//       console.log(`🔄 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Starting widget export process...`);
//       const widgetsStart = performance.now();
//       currentY = await this.exportWidgetsIntelligent(
//         pdf,
//         dashboardElement,
//         widgets,
//         contentWidth,
//         contentHeight,
//         margin,
//         currentY,
//         quality,
//         scale
//       );
//       const widgetsTime = performance.now() - widgetsStart;
//       console.log(`✅ [INTELLIGENT] Widget export completed in ${widgetsTime.toFixed(2)}ms`);

//       // Add footer if requested
//       if (includeFooter) {
//         console.log(`📄 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Adding footer...`);
//         const footerStart = performance.now();
//         this.addFooter(pdf, pageWidth, pageHeight, margin);
//         const footerTime = performance.now() - footerStart;
//         console.log(`✅ [INTELLIGENT] Footer added in ${footerTime.toFixed(2)}ms`);
//       }

//       // Save the PDF file
//       console.log(`💾 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Saving PDF as: ${filename}`);
//       const saveStart = performance.now();
//       pdf.save(filename);
//       const saveTime = performance.now() - saveStart;
      
//       const totalTime = performance.now() - exportStartTime;
//       const endTimestamp = new Date().toLocaleTimeString();
      
//       console.log(`✅ [INTELLIGENT] PDF saved in ${saveTime.toFixed(2)}ms`);
//       console.log(`🎉 [${endTimestamp}] [INTELLIGENT] PDF export completed successfully!`);
//       console.log(`⏱️ [INTELLIGENT] Total export time: ${totalTime.toFixed(2)}ms (${(totalTime/1000).toFixed(2)}s)`);
//       console.log(`📈 [INTELLIGENT] Performance breakdown:`);
//       console.log(`   - Render wait: ${renderWaitTime.toFixed(2)}ms (${((renderWaitTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - PDF creation: ${pdfCreateTime.toFixed(2)}ms (${((pdfCreateTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - Widget processing: ${widgetsTime.toFixed(2)}ms (${((widgetsTime/totalTime)*100).toFixed(1)}%)`);
//       console.log(`   - Save operation: ${saveTime.toFixed(2)}ms (${((saveTime/totalTime)*100).toFixed(1)}%)`);

//     } catch (error) {
//       const errorTime = performance.now() - exportStartTime;
//       const errorTimestamp = new Date().toLocaleTimeString();
//       console.error(`❌ [${errorTimestamp}] [INTELLIGENT] Error exporting dashboard to PDF after ${errorTime.toFixed(2)}ms:`, error);
//       throw new Error('Failed to export dashboard to PDF');
//     }
//   }

//   /**
//    * Add header section to the PDF document
//    * @param pdf - The PDF document instance
//    * @param title - Title to display in the header
//    * @param pageWidth - Width of the PDF page
//    * @param margin - Page margin
//    * @param currentY - Current Y position on the page
//    * @returns Updated Y position after adding header
//    */
//   private addHeader(
//     pdf: jsPDF,
//     title: string,
//     pageWidth: number,
//     margin: number,
//     currentY: number
//   ): number {
//     pdf.setFontSize(16);
//     pdf.setFont('helvetica', 'bold');
//     pdf.text(title, pageWidth / 2, currentY, { align: 'center' });
    
//     // Add timestamp
//     pdf.setFontSize(8);
//     pdf.setFont('helvetica', 'normal');
//     const timestamp = new Date().toLocaleString();
//     pdf.text(`Generated on: ${timestamp}`, pageWidth / 2, currentY + 6, { align: 'center' });
    
//     // Add separator line
//     pdf.setDrawColor(200, 200, 200);
//     pdf.line(margin, currentY + 10, pageWidth - margin, currentY + 10);
    
//     return currentY + 15; // Return updated Y position
//   }

//   /**
//    * Export widgets to PDF using basic layout algorithm
//    * Each widget gets its own page
//    * @param pdf - The PDF document instance
//    * @param dashboardElement - Reference to the dashboard container
//    * @param widgets - Array of widgets to export
//    * @param contentWidth - Available content width
//    * @param contentHeight - Available content height
//    * @param margin - Page margin
//    * @param startY - Starting Y position
//    * @param quality - Image quality for captures
//    * @param scale - Scale factor for captures
//    * @returns Final Y position after export
//    */
//   private async exportWidgets(
//     pdf: jsPDF,
//     dashboardElement: ElementRef<HTMLElement>,
//     widgets: IWidget[],
//     contentWidth: number,
//     contentHeight: number,
//     margin: number,
//     startY: number,
//     quality: number,
//     scale: number
//   ): Promise<number> {
//     let currentY = startY;
//     const startTime = performance.now();
    
//     console.log(`⏱️ Starting widget export at ${new Date().toLocaleTimeString()}`);

//     // Process widgets one by one with delays to prevent UI blocking
//     for (let i = 0; i < widgets.length; i++) {
//       const widget = widgets[i];
//       const widgetStartTime = performance.now();
      
//       try {
//         console.log(`📊 [${new Date().toLocaleTimeString()}] Processing widget ${i + 1} of ${widgets.length}: ${widget.id}`);
        
//         // Yield control to the UI thread before processing each widget
//         const delayStart = performance.now();
//         await new Promise(resolve => setTimeout(resolve, 50));
//         const delayTime = performance.now() - delayStart;
        
//         // Find the widget element in the DOM
//         const findStart = performance.now();
//         const widgetElement = this.findWidgetElement(dashboardElement, widget.id);
//         const findTime = performance.now() - findStart;
        
//         if (!widgetElement) {
//           console.warn(`⚠️ [${new Date().toLocaleTimeString()}] Widget element not found for ${widget.id} (search took ${findTime.toFixed(2)}ms)`);
//           continue; // Skip if widget element not found
//         }

//         console.log(`🔍 Found widget element for ${widget.id} in ${findTime.toFixed(2)}ms`);

//         // Add a small delay before html2canvas to ensure DOM is stable
//         await new Promise(resolve => requestAnimationFrame(resolve));
        
//         console.log(`📸 [${new Date().toLocaleTimeString()}] Capturing widget ${widget.id} with html2canvas...`);
        
//         // Create canvas from widget element - this is the CPU-intensive part
//         const canvasStart = performance.now();
//         const canvas = await html2canvas(widgetElement, {
//           scale,
//           useCORS: true,
//           allowTaint: true,
//           backgroundColor: '#ffffff',
//           logging: false
//         });
//         const canvasTime = performance.now() - canvasStart;

//         console.log(`✅ Canvas created for widget ${widget.id} in ${canvasTime.toFixed(2)}ms, size: ${canvas.width}x${canvas.height}`);

//         // Yield control again after canvas creation
//         const postCanvasDelayStart = performance.now();
//         await new Promise(resolve => setTimeout(resolve, 25));
//         const postCanvasDelayTime = performance.now() - postCanvasDelayStart;

//         // Calculate image dimensions to fit content width
//         const calcStart = performance.now();
//         const imgWidth = contentWidth;
//         const imgHeight = (canvas.height * imgWidth) / canvas.width;
//         const calcTime = performance.now() - calcStart;

//         // Add new page if needed
//         if (currentY + imgHeight > contentHeight) {
//           pdf.addPage();
//           currentY = margin;
//           console.log(`📄 Added new page for widget ${widget.id}`);
//         }

//         // Convert canvas to image and add to PDF
//         const pdfStart = performance.now();
//         const imgData = canvas.toDataURL('image/png', quality);
//         pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
//         const pdfTime = performance.now() - pdfStart;

//         currentY += imgHeight + 10; // Add spacing between widgets
        
//         const widgetTotalTime = performance.now() - widgetStartTime;
        
//         console.log(`✅ [${new Date().toLocaleTimeString()}] Widget ${widget.id} completed in ${widgetTotalTime.toFixed(2)}ms`);
//         console.log(`   📊 Breakdown: Delay=${delayTime.toFixed(1)}ms, Find=${findTime.toFixed(1)}ms, Canvas=${canvasTime.toFixed(1)}ms, PDF=${pdfTime.toFixed(1)}ms, PostDelay=${postCanvasDelayTime.toFixed(1)}ms`);

//       } catch (error) {
//         const widgetErrorTime = performance.now() - widgetStartTime;
//         console.error(`❌ [${new Date().toLocaleTimeString()}] Error exporting widget ${widget.id} after ${widgetErrorTime.toFixed(2)}ms:`, error);
//         // Continue with next widget
//       }
      
//       // Yield control after each widget to keep UI responsive
//       await new Promise(resolve => setTimeout(resolve, 25));
//     }

//     const totalTime = performance.now() - startTime;
//     const avgTimePerWidget = totalTime / widgets.length;
    
//     console.log(`🏁 [${new Date().toLocaleTimeString()}] All widgets exported in ${totalTime.toFixed(2)}ms`);
//     console.log(`📈 Average time per widget: ${avgTimePerWidget.toFixed(2)}ms`);

//     return currentY;
//   }

//   /**
//    * Export widgets to PDF using intelligent layout algorithm
//    * Attempts to preserve widget grid positioning
//    * @param pdf - The PDF document instance
//    * @param dashboardElement - Reference to the dashboard container
//    * @param widgets - Array of widgets to export
//    * @param contentWidth - Available content width
//    * @param contentHeight - Available content height
//    * @param margin - Page margin
//    * @param startY - Starting Y position
//    * @param quality - Image quality for captures
//    * @param scale - Scale factor for captures
//    * @returns Final Y position after export
//    */
//   private async exportWidgetsIntelligent(
//     pdf: jsPDF,
//     dashboardElement: ElementRef<HTMLElement>,
//     widgets: IWidget[],
//     contentWidth: number,
//     contentHeight: number,
//     margin: number,
//     startY: number,
//     quality: number,
//     scale: number
//   ): Promise<number> {
//     let currentY = startY;
//     let currentRow = 0;
//     let currentCol = 0;
//     const maxCols = 2;
//     const startTime = performance.now();
    
//     console.log(`⏱️ [INTELLIGENT] Starting widget export at ${new Date().toLocaleTimeString()}`);

//     // Process widgets one by one with delays to prevent UI blocking
//     for (let i = 0; i < widgets.length; i++) {
//       const widget = widgets[i];
//       const widgetStartTime = performance.now();
      
//       try {
//         console.log(`📊 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Processing widget ${i + 1} of ${widgets.length}: ${widget.id}`);
        
//         // Yield control to the UI thread before processing each widget
//         const delayStart = performance.now();
//         await new Promise(resolve => setTimeout(resolve, 50));
//         const delayTime = performance.now() - delayStart;
        
//         // Find the widget element in the DOM
//         const findStart = performance.now();
//         const widgetElement = this.findWidgetElement(dashboardElement, widget.id);
//         const findTime = performance.now() - findStart;
        
//         if (!widgetElement) {
//           console.warn(`⚠️ [${new Date().toLocaleTimeString()}] [INTELLIGENT] Widget element not found for ${widget.id} (search took ${findTime.toFixed(2)}ms)`);
//           continue; // Skip if widget element not found
//         }

//         console.log(`🔍 [INTELLIGENT] Found widget element for ${widget.id} in ${findTime.toFixed(2)}ms`);

//         // Add a small delay before html2canvas to ensure DOM is stable
//         await new Promise(resolve => requestAnimationFrame(resolve));
        
//         console.log(`📸 [${new Date().toLocaleTimeString()}] [INTELLIGENT] Capturing widget ${widget.id} with html2canvas...`);

//         // Create canvas from widget element - this is the CPU-intensive part
//         const canvasStart = performance.now();
//         const canvas = await html2canvas(widgetElement, {
//           scale,
//           useCORS: true,
//           allowTaint: true,
//           backgroundColor: '#ffffff',
//           logging: false
//         });
//         const canvasTime = performance.now() - canvasStart;

//         console.log(`✅ [INTELLIGENT] Canvas created for widget ${widget.id} in ${canvasTime.toFixed(2)}ms, size: ${canvas.width}x${canvas.height}`);

//         // Yield control again after canvas creation
//         const postCanvasDelayStart = performance.now();
//         await new Promise(resolve => setTimeout(resolve, 25));
//         const postCanvasDelayTime = performance.now() - postCanvasDelayStart;

//         // Calculate widget dimensions
//         const calcStart = performance.now();
//         const widgetWidth = contentWidth / maxCols - 5; // 5mm spacing between widgets
//         const widgetHeight = (canvas.height * widgetWidth) / canvas.width;
//         const calcTime = performance.now() - calcStart;

//         // Check if we need a new page
//         if (currentY + widgetHeight > contentHeight) {
//           pdf.addPage();
//           currentY = margin;
//           currentRow = 0;
//           currentCol = 0;
//           console.log(`📄 [INTELLIGENT] Added new page for widget ${widget.id}`);
//         }

//         // Calculate position based on grid
//         const layoutStart = performance.now();
//         const x = margin + (currentCol * (widgetWidth + 5));
//         const y = currentY;
//         const layoutTime = performance.now() - layoutStart;

//         // Convert canvas to image and add to PDF
//         const pdfStart = performance.now();
//         const imgData = canvas.toDataURL('image/png', quality);
//         pdf.addImage(imgData, 'PNG', x, y, widgetWidth, widgetHeight);
//         const pdfTime = performance.now() - pdfStart;

//         // Update grid position
//         currentCol++;
//         if (currentCol >= maxCols) {
//           currentCol = 0;
//           currentRow++;
//           currentY += widgetHeight + 10; // Add spacing between rows
//         }
        
//         const widgetTotalTime = performance.now() - widgetStartTime;
        
//         console.log(`✅ [${new Date().toLocaleTimeString()}] [INTELLIGENT] Widget ${widget.id} completed in ${widgetTotalTime.toFixed(2)}ms`);
//         console.log(`   📊 [INTELLIGENT] Breakdown: Delay=${delayTime.toFixed(1)}ms, Find=${findTime.toFixed(1)}ms, Canvas=${canvasTime.toFixed(1)}ms, Layout=${layoutTime.toFixed(1)}ms, PDF=${pdfTime.toFixed(1)}ms, PostDelay=${postCanvasDelayTime.toFixed(1)}ms`);
//         console.log(`   📐 [INTELLIGENT] Grid position: Col=${currentCol}, Row=${currentRow}, Position=(${x.toFixed(1)}, ${y.toFixed(1)})`);

//       } catch (error) {
//         const widgetErrorTime = performance.now() - widgetStartTime;
//         console.error(`❌ [${new Date().toLocaleTimeString()}] [INTELLIGENT] Error exporting widget ${widget.id} after ${widgetErrorTime.toFixed(2)}ms:`, error);
//         // Continue with next widget
//       }
      
//       // Yield control after each widget to keep UI responsive
//       await new Promise(resolve => setTimeout(resolve, 25));
//     }

//     const totalTime = performance.now() - startTime;
//     const avgTimePerWidget = totalTime / widgets.length;
    
//     console.log(`🏁 [${new Date().toLocaleTimeString()}] [INTELLIGENT] All widgets exported in ${totalTime.toFixed(2)}ms`);
//     console.log(`📈 [INTELLIGENT] Average time per widget: ${avgTimePerWidget.toFixed(2)}ms`);

//     return currentY;
//   }

//   /**
//    * Add footer section to the PDF document
//    * @param pdf - The PDF document instance
//    * @param pageWidth - Width of the PDF page
//    * @param pageHeight - Height of the PDF page
//    * @param margin - Page margin
//    */
//   private addFooter(
//     pdf: jsPDF,
//     pageWidth: number,
//     pageHeight: number,
//     margin: number
//   ): void {
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
//    * Find widget element in the dashboard DOM
//    * @param dashboardElement - Reference to the dashboard container
//    * @param widgetId - ID of the widget to find
//    * @returns HTMLElement of the widget or null if not found
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
//    * Export a single widget to PDF
//    * @param widgetElement - Reference to the widget element
//    * @param widget - Widget configuration
//    * @param options - PDF export options
//    */
//   async exportWidgetToPdf(
//     widgetElement: ElementRef<HTMLElement>,
//     widget: IWidget,
//     options: PdfExportOptions = {}
//   ): Promise<void> {
//     const {
//       orientation = 'portrait',
//       format = 'a4',
//       margin = 10,
//       filename = `${widget.id}-export.pdf`,
//       title = widget.config?.header?.title || 'Widget Export',
//       includeHeader = true,
//       includeFooter = true,
//       quality = 1,
//       scale = 2
//     } = options;

//     try {
//       console.log(`🚀 Starting single widget PDF export: ${widget.id}`);
      
//       // Shorter wait for chart to be fully rendered
//       console.log('⏳ Waiting for widget to render...');
//       await new Promise(resolve => setTimeout(resolve, 500));

//       // Create PDF document
//       console.log('📄 Creating PDF document...');
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
//         console.log('📋 Adding header...');
//         currentY = this.addHeader(pdf, title, pageWidth, margin, currentY);
//       }

//       // Add a small delay before html2canvas to ensure DOM is stable
//       await new Promise(resolve => requestAnimationFrame(resolve));
      
//       console.log(`📸 Capturing widget ${widget.id} with html2canvas...`);

//       // Create canvas from widget element
//       const canvas = await html2canvas(widgetElement.nativeElement, {
//         scale,
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: '#ffffff',
//         logging: false
//       });

//       console.log(`Canvas created for widget ${widget.id}, size: ${canvas.width}x${canvas.height}`);

//       // Yield control after canvas creation
//       await new Promise(resolve => setTimeout(resolve, 25));

//       // Calculate image dimensions
//       const imgWidth = contentWidth;
//       const imgHeight = (canvas.height * imgWidth) / canvas.width;

//       // Convert canvas to image and add to PDF
//       console.log('📄 Adding widget to PDF...');
//       const imgData = canvas.toDataURL('image/png', quality);
//       pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);

//       // Add footer if requested
//       if (includeFooter) {
//         console.log('📄 Adding footer...');
//         this.addFooter(pdf, pageWidth, pageHeight, margin);
//       }

//       // Save the PDF
//       console.log(`💾 Saving widget PDF as: ${filename}`);
//       pdf.save(filename);
      
//       console.log(`✅ Widget PDF export completed successfully: ${widget.id}`);

//     } catch (error) {
//       console.error(`❌ Error exporting widget ${widget.id} to PDF:`, error);
//       throw new Error('Failed to export widget to PDF');
//     }
//   }
// } 