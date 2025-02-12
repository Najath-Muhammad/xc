const Order = require('../../models/orderSchema')

const getSalesReport = async (req, res) => {
  try {
      const { startDate, endDate, reportType } = req.query;
      let query = {};
      let dateRange = {};

      switch (reportType) {
          case 'daily':
              dateRange = {
                  startDate: new Date(new Date().setHours(0, 0, 0, 0)),
                  endDate: new Date(new Date().setHours(23, 59, 59, 999))
              };
              break;
          case 'weekly':
              const weekStart = new Date();
              weekStart.setDate(weekStart.getDate() - weekStart.getDay());
              weekStart.setHours(0, 0, 0, 0);
              dateRange = {
                  startDate: weekStart,
                  endDate: new Date()
              };
              break;
          case 'monthly':
              const monthStart = new Date();
              monthStart.setDate(1);
              monthStart.setHours(0, 0, 0, 0);
              dateRange = {
                  startDate: monthStart,
                  endDate: new Date()
              };
              break;
          case 'custom':
              dateRange = {
                  startDate: new Date(startDate),
                  endDate: new Date(endDate)
              };
              break;
          default:
              dateRange = {
                  startDate: new Date(new Date().setHours(0, 0, 0, 0)),
                  endDate: new Date(new Date().setHours(23, 59, 59, 999))
              };
      }

      
      query = {
          createdOn: {
              $gte: dateRange.startDate,
              $lte: dateRange.endDate
          },
          status: { $nin: ['Cancelled','Pending','Processing', 'Return Requested', 'Returned'] } 
      }

      const orders = await Order.find(query).sort({ createdOn: -1 });

      const reportData = {
          totalOrders: orders.length,
          totalSales: orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0),
          totalDiscount: orders.reduce((sum, order) => sum + (order.discount || 0), 0),
          couponDiscount: orders.reduce((sum, order) => {
              if (order.couponApplied) {
                  return sum + ((order.totalPrice - order.finalAmount) || 0);
              }
              return sum;
          }, 0),
          orders: orders.map(order => ({
              orderId: order.orderId,
              date: order.createdOn,
              amount: order.finalAmount,
              discount: order.discount,
              status: order.status,
              paymentMethod: order.paymentMethod
          }))
      };

      
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
          return res.json(reportData);
      } else {
          return res.render('salesReport', {
              reportData,
              startDate: dateRange.startDate,
              endDate: dateRange.endDate,
              reportType,
              title: 'Sales Report'
          });
      }

  } catch (error) {
      console.error('Error generating sales report:', error);
      res.status(500).json({ 
          status: false, 
          message: 'Error generating sales report' 
      });
  }
};




const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');


const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};


const getDateRange = (reportType, startDate, endDate) => {
    const now = new Date();
    let start = new Date(now);
    let end = new Date(now);

    switch (reportType) {
        case 'daily':
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            break;
        case 'weekly':
            start.setDate(now.getDate() - now.getDay());
            start.setHours(0, 0, 0, 0);
            break;
        case 'monthly':
            start.setDate(1);
            start.setHours(0, 0, 0, 0);
            break;
        case 'custom':
            start = new Date(startDate);
            end = new Date(endDate);
            break;
    }
    return { start, end };
};

const exportSalesReport = async (req, res) => {
    try {
        const { type, reportType, startDate, endDate } = req.query;
        const dateRange = getDateRange(reportType, startDate, endDate);

        
        const orders = await Order.find({
            createdOn: {
                $gte: dateRange.start,
                $lte: dateRange.end
            },
            status: { $nin: ['cancelled'] }
        }).populate('userId', 'name email');
        console.log('orders:',orders)

        
        const totals = {
            totalSales: orders.reduce((sum, order) => sum + (order.finalAmount || 0), 0),
            totalDiscount: orders.reduce((sum, order) => sum + (order.discount || 0), 0),
            totalOrders: orders.length
        };

        if (type === 'excel') {
            await generateExcelReport(orders, totals, dateRange, res);
        } else if (type === 'pdf') {
            await generatePDFReport(orders, totals, dateRange, res);
        } else {
            res.status(400).json({ status: false, message: 'Invalid export type' });
        }

    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ status: false, message: 'Error generating report' });
    }
};

const generateExcelReport = async (orders, totals, dateRange, res) => {
    console.log('data',orders)
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'Sales Report';
    worksheet.getCell('A1').font = { size: 16, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    
    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = `Period: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`;
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    
    worksheet.addRow(['']);
    worksheet.addRow(['Summary']);
    worksheet.addRow(['Total Orders', totals.totalOrders]);
    worksheet.addRow(['Total Sales', formatCurrency(totals.totalSales)]);
    worksheet.addRow(['Total Discount', formatCurrency(totals.totalDiscount)]);
    worksheet.addRow(['Net Amount', formatCurrency(totals.totalSales - totals.totalDiscount)]);
    worksheet.addRow(['']);

    
    worksheet.addRow([
        'Order ID',
        'Date',
        'Customer',
        'Amount',
        'Discount',
        'Final Amount',
        'Status'
    ]);

    
    worksheet.getRow(8).font = { bold: true };
    worksheet.getRow(8).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
    };

    
    orders.forEach(order => {
        worksheet.addRow([
            order.orderId,
            new Date(order.createdOn).toLocaleDateString(),
            order.userId?.name || 'N/A',
            order.totalPrice,
            order.discount,
            order.finalAmount,
            order.status
        ]);
    });

    
    worksheet.columns.forEach(column => {
        column.width = 15;
        column.alignment = { horizontal: 'left' };
    });

    
    res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
        'Content-Disposition',
        'attachment; filename=sales-report.xlsx'
    );

    
    await workbook.xlsx.write(res);
};

const generatePDFReport = async (orders, totals, dateRange, res) => {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });

    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=sales-report.pdf');

    
    doc.pipe(res);

    
    doc.fontSize(20).text('Sales Report', { align: 'center' });
    doc.moveDown();

    
    doc.fontSize(12).text(
        `Period: ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`,
        { align: 'center' }
    );
    doc.moveDown();

    
    const summaryTable = {
        headers: ['Metric', 'Value'],
        rows: [
            ['Total Orders', totals.totalOrders.toString()],
            ['Total Sales', formatCurrency(totals.totalSales)],
            ['Total Discount', formatCurrency(totals.totalDiscount)],
            ['Net Amount', formatCurrency(totals.totalSales - totals.totalDiscount)]
        ]
    };

    await doc.table(summaryTable, {
        prepareHeader: () => doc.font('Helvetica-Bold'),
        prepareRow: () => doc.font('Helvetica')
    });
    
    doc.moveDown();

    
    const ordersTable = {
        headers: ['Order ID', 'Date', 'Amount', 'Discount', 'Final', 'Status'],
        rows: orders.map(order => [
            order.orderId,
            new Date(order.createdOn).toLocaleDateString(),
            formatCurrency(order.totalPrice),
            formatCurrency(order.discount),
            formatCurrency(order.finalAmount),
            order.status
        ])
    };

    await doc.table(ordersTable, {
        prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
        prepareRow: () => doc.font('Helvetica').fontSize(10)
    });

    
    doc.end();
};
const getSalesData = async (req, res) => {
    try {
        const { filterType } = req.query;
        const currentDate = new Date();
        let startDate;

        // Set date range based on filter type
        switch (filterType) {
            case 'yearly':
                startDate = new Date(currentDate);
                startDate.setFullYear(currentDate.getFullYear() - 2);
                startDate.setMonth(0, 1); // Start of the year
                break;
            case 'monthly':
                startDate = new Date(currentDate);
                startDate.setMonth(currentDate.getMonth() - 5, 1); // Last 6 months
                break;
            case 'weekly':
                startDate = new Date(currentDate);
                startDate.setDate(currentDate.getDate() - 6); // Last 7 days
                startDate.setHours(0, 0, 0, 0);
                break;
            default:
                return res.status(400).json({
                    success: false,
                    message: "Invalid filter type"
                });
        }

        // Debug: Log the date range
        console.log('Date Range:', {
            startDate,
            currentDate
        });

        // First, let's check if we have any orders at all
        const totalOrders = await Order.countDocuments({ status: 'Delivered' });
        console.log('Total Delivered Orders:', totalOrders);

        // Check a sample order to verify structure
        const sampleOrder = await Order.findOne({ status: 'Delivered' });
        console.log('Sample Order Structure:', JSON.stringify(sampleOrder, null, 2));

        const matchQuery = {
            status: 'Delivered',
            createdOn: {
                $gte: startDate,
                $lte: currentDate
            }
        };

        // Debug: Log the match query
        console.log('Match Query:', JSON.stringify(matchQuery, null, 2));

        // Let's try the aggregation pipeline step by step
        const pipeline = [
            { 
                $match: matchQuery 
            },
            {
                $unwind: '$orderedItems'
            },
            {
                $match: {
                    'orderedItems': { $exists: true, $not: { $size: 0 } }
                }
            },
            {
                $group: {
                    _id: filterType === 'yearly' 
                        ? { $year: '$createdOn' }
                        : filterType === 'monthly'
                            ? {
                                year: { $year: '$createdOn' },
                                month: { $month: '$createdOn' }
                            }
                            : {
                                year: { $year: '$createdOn' },
                                month: { $month: '$createdOn' },
                                day: { $dayOfMonth: '$createdOn' }
                            },
                    totalAmount: {
                        $sum: {
                            $multiply: ['$orderedItems.price', '$orderedItems.quantity']
                        }
                    },
                    count: { $sum: 1 }
                }
            },
            { 
                $sort: { '_id': 1 } 
            }
        ];
        // Debug: Log the pipeline
        console.log('Aggregation Pipeline:', JSON.stringify(pipeline, null, 2));

        const salesData = await Order.aggregate(pipeline);

        // Debug: Log the raw aggregation results
        console.log('Raw Aggregation Results:', JSON.stringify(salesData, null, 2));

        // Process and format the data
        let labels = [];
        let data = [];

        if (filterType === 'yearly') {
            const years = Array.from({ length: 3 }, (_, i) => currentDate.getFullYear() - 2 + i);
            years.forEach(year => {
                const yearData = salesData.find(item => 
                    typeof item._id === 'number' ? item._id === year : item._id.year === year
                );
                labels.push(year.toString());
                data.push(yearData ? Math.round(yearData.totalAmount) : 0);
            });
        } else if (filterType === 'monthly') {
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const months = Array.from({ length: 6 }, (_, i) => {
                const date = new Date(currentDate);
                date.setMonth(currentDate.getMonth() - 5 + i);
                return {
                    year: date.getFullYear(),
                    month: date.getMonth() + 1,
                    label: monthNames[date.getMonth()]
                };
            });

            months.forEach(({ year, month, label }) => {
                const monthData = salesData.find(item => 
                    item._id.year === year && item._id.month === month
                );
                labels.push(label);
                data.push(monthData ? Math.round(monthData.totalAmount) : 0);
            });
        } else {
            const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(currentDate);
                date.setDate(date.getDate() - i);
                
                const dayData = salesData.find(item =>
                    item._id.year === date.getFullYear() &&
                    item._id.month === (date.getMonth() + 1) &&
                    item._id.day === date.getDate()
                );

                labels.push(dayNames[date.getDay()]);
                data.push(dayData ? Math.round(dayData.totalAmount) : 0);
            }
        }
        
        console.log('Formatted Data:', {
            labels,
            data
        });

        return res.status(200).json({
            success: true,
            labels,
            data
        });

    } catch (error) {
        console.error('Error in getSalesData:', error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
};

  
  const generateLedger = async (req, res) => {
      try {
  const orders = await Order.aggregate([
      {
          $lookup: {
              from: 'users',
              localField: 'userId',
              foreignField: '_id',
              as: 'userInfo'
          }
      },
      {
          $unwind: '$userInfo'
      },
      {
          $project: {
              orderId: 1,
              userId: 1,
              finalAmount: 1,
              paymentMethod: 1,
              status: 1,
              createdOn: 1,
              userName: '$userInfo.name'
          }
      },
      {
          $sort: { createdOn: -1 }
      }
  ]);
  console.log('orders',orders)
  
          if (!orders.length) {
              return res.status(404).json({ message: "No orders found" });
          }
  
          const doc = new PDFDocument({ margin: 40, size: 'A3', layout: 'landscape' });

const reportsDir = path.join(__dirname, '../public/reports');
if (!fs.existsSync(reportsDir)) {
fs.mkdirSync(reportsDir, { recursive: true });
}

const filePath = path.join(reportsDir, 'ledger.pdf');
const stream = fs.createWriteStream(filePath);
doc.pipe(stream);

// Title
doc.fontSize(26).fillColor('#000').text('Ledger Book', { align: 'center', underline: true }).moveDown(1);

// Column Settings
const columnWidths = {
orderId: 120,
user: 150,
amount: 100,
paymentMethod: 120,
status: 120,
createdOn: 200
};

const totalTableWidth = Object.values(columnWidths).reduce((a, b) => a + b); // Calculate total table width
const startX = (doc.page.width - totalTableWidth) / 2; // Center the table horizontally
const startY = doc.y;

// Table Headers
doc
.font('Helvetica-Bold')
.fontSize(14)
.fillColor('#fff')
.rect(startX, startY, totalTableWidth, 30)
.fill('#333')
.fillColor('#fff');

doc.text('Order ID', startX + 10, startY + 8, { width: columnWidths.orderId, align: 'left' });
doc.text('User', startX + 10 + columnWidths.orderId, startY + 8, { width: columnWidths.user, align: 'left' });
doc.text('Amount', startX + 10 + columnWidths.orderId + columnWidths.user, startY + 8, { width: columnWidths.amount, align: 'center' });
doc.text('Payment', startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount, startY + 8, { width: columnWidths.paymentMethod, align: 'center' });
doc.text('Status', startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount + columnWidths.paymentMethod, startY + 8, { width: columnWidths.status, align: 'center' });
doc.text('Order Created', startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount + columnWidths.paymentMethod + columnWidths.status, startY + 8, { width: columnWidths.createdOn, align: 'center' });

doc.moveDown(1);

// Orders Data
let yPosition = startY + 40;
const rowHeight = 40; // Adjust the row height as needed
const pageBottomMargin = doc.page.height - 60; // Leave some space at the bottom

orders.forEach((order, index) => {
// Check if yPosition is too close to the bottom of the page
if (yPosition + rowHeight > pageBottomMargin) {
doc.addPage();
yPosition = 50; // Reset yPosition for the new page

// Re-draw the table headers on the new page
doc
  .font('Helvetica-Bold')
  .fontSize(14)
  .fillColor('#fff')
  .rect(startX, yPosition, totalTableWidth, 30)
  .fill('#333')
  .fillColor('#fff');

doc.text('Order ID', startX + 10, yPosition + 8, { width: columnWidths.orderId, align: 'left' });
doc.text('User', startX + 10 + columnWidths.orderId, yPosition + 8, { width: columnWidths.user, align: 'left' });
doc.text('Amount', startX + 10 + columnWidths.orderId + columnWidths.user, yPosition + 8, { width: columnWidths.amount, align: 'center' });
doc.text('Payment', startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount, yPosition + 8, { width: columnWidths.paymentMethod, align: 'center' });
doc.text('Status', startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount + columnWidths.paymentMethod, yPosition + 8, { width: columnWidths.status, align: 'center' });
doc.text('Order Created', startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount + columnWidths.paymentMethod + columnWidths.status, yPosition + 8, { width: columnWidths.createdOn, align: 'center' });

yPosition += 40; // Move yPosition below the header
}

// Fill each order row
const bgColor = index % 2 === 0 ? '#f3f3f3' : '#fff';
doc.rect(startX, yPosition, totalTableWidth, rowHeight).fill(bgColor).fillColor('#000');

doc
.font('Helvetica')
.fontSize(12)
.text(order.orderId.slice(-9), startX + 10, yPosition + 8, { width: columnWidths.orderId, align: 'left' })
.text(order.userName || 'Guest', startX + 10 + columnWidths.orderId, yPosition + 8, { width: columnWidths.user, align: 'left' })
.text(`₹${order.finalAmount.toFixed(2)}`, startX + 10 + columnWidths.orderId + columnWidths.user, yPosition + 8, { width: columnWidths.amount, align: 'center' })
.text(order.paymentMethod, startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount, yPosition + 8, { width: columnWidths.paymentMethod, align: 'center' })
.text(order.status, startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount + columnWidths.paymentMethod, yPosition + 8, { width: columnWidths.status, align: 'center' })
.text(order.createdOn.toLocaleDateString('en-GB') + ' ' + order.createdOn.toLocaleTimeString('en-GB'), startX + 10 + columnWidths.orderId + columnWidths.user + columnWidths.amount + columnWidths.paymentMethod + columnWidths.status, yPosition + 8, { width: columnWidths.createdOn, align: 'center' });

yPosition += rowHeight;
});

// Add Footer with Ledger Download Date
doc.moveDown(2);
doc
.font('Helvetica-Bold')
.fontSize(12)
.text(`Ledger Book Downloaded on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, {
align: 'right'
});

doc.end();

stream.on('finish', () => {
res.download(filePath, 'ledger.pdf', (err) => {
if (err) console.error(err);
fs.unlinkSync(filePath); // Delete after download
});
});

  
      } catch (error) {
          console.error('Error generating ledger:', error);
          res.status(500).json({ message: "Error generating ledger" });
      }
  };
  
  



module.exports = {
  getSalesReport,
  exportSalesReport,
  getSalesData,
  generateLedger
}