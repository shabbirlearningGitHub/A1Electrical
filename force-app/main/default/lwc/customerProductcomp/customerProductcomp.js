import { LightningElement, track,api } from 'lwc';
import searchProducts from '@salesforce/apex/CustomerProduct.searchProducts';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import createCustomer from '@salesforce/apex/CustomerProduct.createCustomer';
import {loadScript} from 'lightning/platformResourceLoader';
import jsPDF from '@salesforce/resourceUrl/jsPDF';
import jspdfautotable from '@salesforce/resourceUrl/jspdfautotable';
export default class CustomerProductcomp extends LightningElement {
    jsPDFInitialized = false;
    //Product Data
    @track isModalOpen = false;
    @track products = [];
    @track searchItem = '';
    @track selectedProductsdata = [];
    @track isDatatable = false;
    @track totalNetPrice = 0;
    @track calculatedAmount;
    @api extraProductFlag = false;

    //Customer Data
    @track name = '';
    @track phone = '';
    @track email = '';
    @track address = '';
    @api discountValue;
    @api discount;
    @api netAmount;
    @api productName;
    @api pType;
    @api exQuantity = 1;
    @api exListPrce;
    @api exNetPrice;
    @api exbasePrice;
    @track customerData = [];

    jsPDFInitialized = false;
    @track col = [{label: 'Product Name', fieldName: 'Name',type: 'text' },
                  {label: 'Quantity', fieldName: 'Quantity__c', type: 'editable', editable: true, typeAttributes: {placeholder: 'Enter Quantity', value: {fieldName: 'Quantity__c'}, step: '1', type: 'number', }, },
                  {label: 'Base Price', fieldName: 'Base_Price__c', type: 'currency', },
                  {label: 'List Price', fieldName: 'List_Price__c', type: 'currency', },
                  {label: 'Net Price', fieldName: 'Net_Price__c', type: 'currency', },
                  {label: 'Remove',type: 'button',typeAttributes: {label: 'Remove', name: 'remove', title: 'Remove Product', disabled: false, value: 'remove', iconPosition: 'left', variant: 'destructive', rowActions: [{label: 'Remove',name: 'remove'}],},}];
    columns = [{label: 'Product Name', fieldName: 'Name', type: 'text'},
               {label: 'Quantity', fieldName: 'Quantity__c', type: 'number'},
               {label: 'Base Price', fieldName: 'Base_Price__c', type: 'currency',},
               {label: 'List Price', fieldName: 'List_Price__c', type: 'currency', },
               {label: 'Net Price', fieldName: 'Net_Price__c', type: 'currency',}];
    renderedCallback() {
        console.log('renderedCallback start');
        if (this.jsPdfInitialized) {
            return;
        }
        this.jsPdfInitialized = true;
        
        loadScript(this, jsPDF)
        .then(() => {
            console.log('then');
            // load the autotable js file
           loadScript(this, jspdfautotable);
        })
        .catch(error => {
            console.log('error');
            throw(error);
        });
    }
        handleOnChange(event) {
        const buttonValue = event.target.dataset.name;
        console.log('name'+event.target.dataset.name);

        switch (buttonValue) {
            case 'Customer Name':
                this.name = event.target.value;
                break;
            case 'Phone':
                this.phone = event.target.value;
                break;
            case 'Email':
                this.email = event.target.value;
                break;
            case 'Address':
                this.address = event.target.value;
                break;
            case 'Discount':
                console.log('discount' +event.target.value );
                this.discount = event.target.value;
                this.discountValue =  (this.discount * this.calculatedAmount)/100;
                this.netAmount = this.calculatedAmount - this.discountValue;
                console.log('discount amount**'+(this.discount * this.calculatedAmount)/100);
                // Add your code for Option 3 here
                break;
            case 'Product Name':
                this.productName = event.target.value;
                break;
            case 'BasePrice':
                this.exbasePrice = event.target.value;
                break;
            case 'Quantity':
                this.exQuantity = event.target.value;
                this.exNetPrice  = (this.exListPrce >0 && this.exQuantity >0) ? this.exListPrce* this.exQuantity : 0;
                break;
            case 'List Price':
                this.exListPrce = event.target.value;
                this.exNetPrice  = (this.exListPrce >0 && this.exQuantity >0) ? this.exListPrce* this.exQuantity : 0;
                break;
            default:
            
                console.log('Unknown option selected');
                // Handle any other cases here
                break;
        }
    }
    handleAddCustomer() {
        console.log('Insidecust******');
        createCustomer({
                name: this.name,
                phone: this.phone,
                email: this.email,
                address: this.address})
            .then(result => {
                if (result) {
                   // generatePDF();
                    console.log('data' + JSON.stringify(result));
                    this.customerData = result;
                   /* const event = new ShowToastEvent({
                    title: 'Success',
                    message: 'Customer Created Successfully',
                    variant: 'success',
                    mode: 'dismissable'});
                this.dispatchEvent(event);*/
                this.generatePDF();
                }
            })
            .catch(error => {
                console.error(result);               
                console.error(error);
            });
    }
    handleAddProduct() {
        const getValue = this.template.querySelector('lightning-input[data-name="input"]').value;
        if (getValue) {
            this.searchItem = getValue;
            console.log('Input field value:', this.searchItem);
        } else {
            alert('Please enter product Name in search box');
        }
        this.isModalOpen = true;
        searchProducts({prodName: this.searchItem})
            .then(result => {
                this.products = result;
                console.log('product data****' + JSON.stringify(result));
            })
            .catch(error => {
                this.dispatchEvent(new ShowToastEvent({
                    title: 'Error',
                    message: 'No data with this search',
                    variant: 'Error'
                }));
            });
    }
    handleCheckboxChange(event) {}
    closeModal() {
        this.isModalOpen = false;
    }
    submitDetails() {
        this.isModalOpen = false;
        var makeNull = this.template.querySelector('lightning-input[data-name="input"]');
        this.searchItem = makeNull.value;
        makeNull.value = '';
        const datatable1 = this.template.querySelector('[data-id="datatable1"]');
        const selectedRecords = datatable1.getSelectedRows();
        if (selectedRecords) {
            this.isDatatable = true;
        }
        console.log('Newly selected records ' + JSON.stringify(selectedRecords));
        this.selectedProductsdata = [...this.selectedProductsdata, ...selectedRecords];
        console.log('data' + JSON.stringify(this.selectedProductsdata));
        if(this.selectedProductsdata != null && this.selectedProductsdata !=''){
            console.log('calculateToatal***');
           this.calculateTotal(); 
        }
    }
    handleRowSelection(event) {
        console.log('inside handleRowSelection');
        const action = event.detail.action;
        const row = event.detail.row;
        let itemRemoved = false;
        if (action.name === 'remove' && !itemRemoved) {
            this.selectedProductsdata = this.selectedProductsdata.filter(item => {
            if (!itemRemoved && item.Id === row.Id) {
                itemRemoved = true;
                return false;
            }
            return true;
            });
            if(this.selectedProductsdata != null && this.selectedProductsdata !=''){
                console.log('calculateToatal***');
                 this.calculateTotal(); 
            }
        }
    }
    handleQuantityChange(event) {
        console.log('handleQuantityChange');
        const editedValues = event.detail.draftValues[0];
        console.log('editedValues'+JSON.stringify(editedValues));
        console.log('oen  '+editedValues.Id.startsWith('row'));
        if(editedValues.Id.startsWith('row')){
            const event = new ShowToastEvent({
                title: 'error',
                message: 'You can not edit the ExtraProduct Quantity, If really need to edit Please remove the record and add newly ',
                variant: 'errror',
                mode: 'dismissable'});
            this.dispatchEvent(event); 
        } else if (editedValues) {
            const editedRowId = editedValues.Id;
            const originalRow = this.selectedProductsdata.find(row => row.Id === editedRowId);
            //console.log('originalRow***'+originalRow);
            if (originalRow && originalRow != undefined) {
                editedValues.Name = originalRow.Name;
                editedValues.List_Price__c = originalRow.List_Price__c;
                editedValues.Base_Price__c = originalRow.Base_Price__c;
                editedValues.Quantity__c = editedValues.Quantity__c;
                editedValues.Net_Price__c = editedValues.Quantity__c * originalRow.List_Price__c;
                const updatedData = this.selectedProductsdata.map(row => {
                    if (row.Id === editedRowId) {
                        return {
                            ...editedValues
                        };
                    }
                    return row;
                });
                this.selectedProductsdata = updatedData;
                console.log('editedRows***********' + JSON.stringify(this.selectedProductsdata));
               if(this.selectedProductsdata != null && this.selectedProductsdata !=''){
                    console.log('calculateToatal***');
                    this.calculateTotal(); 
                }
            }
        }
          
    }
    calculateTotal() {
        this.totalNetPrice = this.selectedProductsdata.reduce((total, row) => {
            return total + (row.Net_Price__c || 0);}, 0);
        this.calculatedAmount = this.totalNetPrice;
        this.discountValue = this.discount > 0 ? (this.totalNetPrice * this.discount)/100 : 0; 
        this.netAmount = this.discount > 0 ? (this.totalNetPrice - (this.totalNetPrice * this.discount)/100) : this.totalNetPrice;
    }   
    generatePDF() {
        console.log('inPDF');
        var customerName;
        var customerAddress;
        var customerPhone;
        var customerEmail;
        if(this.customerData != null && this.customerData != ''){
            console.log('Customer details***'+ this.customerData);
            customerName = this.customerData[0].Name;
            customerPhone = this.customerData[0].Phone__c;
            customerAddress = this.customerData[0].Address__c;
            customerEmail = this.customerData[0].Email__c;
        }
        const totalprice = this.calculatedAmount;
        const DiscountAmount = this.discountValue;
        const NetAmount = this.netAmount;
        const { jsPDF  } = window.jspdf;
        const doc = new jsPDF();
        const currentDate = new Date();
        const dateFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        const formattedDate = currentDate.toLocaleDateString(undefined, dateFormatOptions);

        // Add the current date to the PDF
        //pdf.setFontSize(12);
        doc.setFontSize(20);
        doc.setFont('helvetica');
        doc.setTextColor(128, 0, 0);
        doc.text("A1 Kwality Electricals INVOICE", 50, 20, );
        doc.setFontSize(12);
        const margin1 = 10; // Margin from the right edge of the page
        const pageWidth1 = doc.internal.pageSize.getWidth();
        const textWidth = doc.getStringUnitWidth(formattedDate) * doc.internal.getFontSize();
        const x = pageWidth1 - margin1 - textWidth;
        const y = 30; // Vertical position
        doc.text(`Date: ${formattedDate}`, x, y);
        //doc.text(`Date: ${formattedDate}`, 10, 50);
        doc.setFontSize(10)
        doc.text('Customer Details:', 10, 40);
        doc.text(`Name: ${customerName}`, 10, 50);
        doc.text(`Address: ${customerAddress}`, 10, 60);
        doc.text(`Phone: ${customerPhone}`, 10, 70);
        doc.text(`Email: ${customerEmail}`, 10, 80);
        const columns = ['Product Name', 'Quantity', 'Base Price', 'List Price', 'Net Price'];
        const body = [];
        let totalPages = 0;
    // Calculate the number of rows per page based on table height and margins
        const pageSize = doc.internal.pageSize;
        const pageWidth = pageSize.width;
        const pageHeight = pageSize.height;
        const margin = 10;
        const maxRowsPerPage = Math.floor((pageHeight - 2 * margin) / 10);
        this.selectedProductsdata.forEach((product, index) => {
            const rowData = [product.Name, product.Quantity__c, product.Base_Price__c, product.List_Price__c, product.Net_Price__c];
            body.push(rowData);
        });
        doc.autoTable({
                    head: [columns],
                    body: body,
                    startY: 100,
                    theme: 'grid',
        });
        console.log('datatable executed');
            
        if(doc.internal.getNumberOfPages() >1){
            for (let pageNum = 1; pageNum <= doc.internal.getNumberOfPages(); pageNum++) {
            doc.setDrawColor(0); // Set the border color to black (RGB: 0, 0, 0)
            //doc.setLineWidth(1);
            doc.setPage(pageNum); // Set the current page
            doc.rect(10, 10, doc.internal.pageSize.width-20,doc.internal.pageSize.height -20);            
        }
        }
        const tableHeight = doc.previousAutoTable.finalY;
        const textY = tableHeight + 20;
        doc.text(`Total Amount: ${totalprice}`, 150, textY);
        doc.text(`Discount Amount: ${DiscountAmount}`, 145, tableHeight + 25);
        doc.text(`Net Amount: ${NetAmount}`, 153, tableHeight + 30);
        // Save the PDF as a Blob
        const pdfBlob = doc.output('blob');

        // Create a Blob URL
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Open the PDF in a new window
        //window.open(pdfUrl, '_blank');
        doc.save('invoice '+customerName+' '+formattedDate+'.pdf');
} 
handleExtraProduct(){
    console.log('handleExtraProduct');
    this.extraProductFlag = true;
    
}
handleSaveButton(event){
    var tempList = [];
    console.log('handleSaveButton');
    this.isDatatable = true;
    const newRow = {
        Name: this.productName,
        Quantity__c: this.exQuantity,
        Base_Price__c: this.exbasePrice,
        List_Price__c: this.exListPrce,
        Net_Price__c:this.exNetPrice
    };
    this.extraProductFlag = false;
    tempList.push(newRow);

    this.selectedProductsdata = [...this.selectedProductsdata, ...tempList];
   // 
   if(this.selectedProductsdata != null && this.selectedProductsdata !=''){
        this.productName ='';
        this.exbasePrice ='';
        this.exListPrce = '';
        this.exNetPrice = '';
        console.log('calculateToatal***');
        this.calculateTotal(); 
    }
     
     console.log('selecedProducts****'+ this.selectedProductsdata);
}
}