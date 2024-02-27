import { LightningElement, api } from 'lwc';
export default class ProductModal extends LightningElement {

    @api isModalOpen = false;
    @api products = [];

    closeModal() {
        this.dispatchEvent(new CustomEvent('closemodal'));
    }

}