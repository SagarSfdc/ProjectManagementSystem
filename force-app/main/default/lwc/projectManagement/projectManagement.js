import { LightningElement, wire } from 'lwc';
/* Lightning Libraries */
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { publish, MessageContext } from 'lightning/messageService';

/* Lightning Message Channel */
import projectMessageChannel from '@salesforce/messageChannel/ProjectCreationChannel__c';

export default class ProjectManagement extends NavigationMixin(LightningElement) {
    displayOverview = false;
    displayProjectInput = false;

    projectRecordId;
    welcomeText = "We're here to help you plan, organize, and manage your projects effectively";

    @wire(MessageContext)
    messageContext;

    get dropdownOptions() {
        return [
            { label: 'Yes', value: 'Yes' },
            { label: 'No', value: 'No' },
        ];
    }

    handleCreateProject(event) {
        let payload;
        if (event.detail?.value === 'Yes') {
            this.displayOverview = false;
            this.displayProjectInput = false;
            payload = { projectToCreate: 'YES' };
        } else {
            this.displayOverview = true;
            payload = { projectToCreate: 'NO' };
        }

        publish(this.messageContext, projectMessageChannel, payload);
    }

    handleOverview(event) {
        if (event.detail?.value === 'Yes') {
            this.displayProjectInput = true;
        } else {
            this.displayProjectInput = false;
            this.showToast('error', 'There are no other options available. You have to select either "Create Project" or "Option YES for Overview".');
        }
    }

    handleRecordChange(event) {
        this.projectRecordId = event.detail.recordId;
        this.navigateToRecord();
    }

    navigateToRecord() {
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.projectRecordId,
                actionName: 'view'
            }
        });
    }

    showToast(variantMsg, messageToDisplay) {
        const event = new ShowToastEvent({
            variant: variantMsg,
            message: messageToDisplay
        });
        this.dispatchEvent(event);
    }
}