import { LightningElement, wire } from 'lwc';
/* Lightning Libraries */
import { subscribe, unsubscribe, APPLICATION_SCOPE, MessageContext } from 'lightning/messageService';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { createRecord } from "lightning/uiRecordApi";
/* Lightning Message Channel */
import projectMessageChannel from '@salesforce/messageChannel/ProjectCreationChannel__c';
/* Project object & fields */
import NAME_FIELD from '@salesforce/schema/Projects__c.Name';
import DESC_FIELD from '@salesforce/schema/Projects__c.Project_Description__c';
import STATUS_FIELD from '@salesforce/schema/Projects__c.Status__c';

/* Project Milestone object & fields */
import MILESTONE_OBJECT from "@salesforce/schema/Project_Milestones__c";
import MILESTONE_NAME from "@salesforce/schema/Project_Milestones__c.Name";
import MILESTONE_DUEDATE from "@salesforce/schema/Project_Milestones__c.Due_Date__c";
import MILESTONE_PROJECT from "@salesforce/schema/Project_Milestones__c.Project__c";

/* TO Do Items object & fields */
import ITEM_OBJECT from "@salesforce/schema/TO_DO_Items__c";
import ITEM_NAME from "@salesforce/schema/TO_DO_Items__c.Name";
import ITEM_DUEDATE from "@salesforce/schema/TO_DO_Items__c.Due_Date__c";
import ITEM_PROJECT from "@salesforce/schema/TO_DO_Items__c.Project_Milestones__c";

export default class ProjectCreation extends LightningElement {
    subscription = null;
    projectToCreate = false;
    milestonesToCreate = false;
    itemsToCreate = false;

    projectRecordId;
    milestones = [];
    items = [];

    @wire(MessageContext)
    messageContext;

    fields = [NAME_FIELD, DESC_FIELD, STATUS_FIELD];
    objectApiName = 'Projects__c';
    connectedCallback() {
        this.subscribeToMessageChannel();
    }

    disconnectedCallback() {
        this.unsubscribeToMessageChannel();
    }

    subscribeToMessageChannel() {
        if (!this.subscription) {
            this.subscription = subscribe(
                this.messageContext,
                projectMessageChannel,
                (message) => this.handleMessage(message),
                { scope: APPLICATION_SCOPE },
            );
        }
    }

    unsubscribeToMessageChannel() {
        unsubscribe(this.subscription);
        this.subscription = null;
    }

    handleMessage(message) {
        this.projectToCreate = message.projectToCreate === 'YES';
    }

    handleSuccess(event) {
        this.projectRecordId = event.detail.id;
        this.showToast('success', 'Project has been successfully created.');
        this.projectToCreate = false;
        this.addMilestone();
    }

    handleMilestoneName(event) {
        let index = event.target.dataset.index;
        this.milestones[index] = { "Name": event.target.value, "Due_Date__c": this.milestones[index].Due_Date__c, "Project__c": this.milestones[index].Project__c };
    }
    handleMilestoneDueDate(event) {
        let index = event.target.dataset.index;
        this.milestones[index] = { "Name": this.milestones[index].Name, "Due_Date__c": event.target.value, "Project__c": this.milestones[index].Project__c };

    }
    handleMilestoneProject(event) {
        let index = event.target.dataset.index;
        this.milestones[index] = { "Name": this.milestones[index].Name, "Due_Date__c": this.milestones[index].Due_Date__c, "Project__c": event.detail.recordId };
    }

    addMilestone() {
        this.milestones.push({
            Name: '',
            Due_Date__c: null,
            Project__c: this.projectRecordId ? this.projectRecordId : ''
        });
        this.resetMilestones();
    }

    removeMilestone(event) {
        let index = event.target.dataset.index;
        this.milestones.splice(index, 1);
        this.resetMilestones();
    }

    resetMilestones() {
        this.milestonesToCreate = false;
        this.milestonesToCreate = true;
    }

    async handleMilestones() {
        const allRecords = this.milestones.map(eachRecord => {
            const recordInput = {
                apiName: MILESTONE_OBJECT.objectApiName,
                fields: {
                    [MILESTONE_NAME.fieldApiName]: eachRecord.Name,
                    [MILESTONE_DUEDATE.fieldApiName]: eachRecord.Due_Date__c,
                    [MILESTONE_PROJECT.fieldApiName]: eachRecord.Project__c
                }
            };
            return createRecord(recordInput);
        });

        try {
            await Promise.all(allRecords);
            this.showToast('success', 'Milestones has been created successfully.');
            this.milestonesToCreate = false;
            this.addItems();
        } catch (error) {
            this.showToast('error', JSON.stringify(error));
        }
    }

    handleItemName(event) {
        let index = event.target.dataset.index;
        this.items[index] = { "Name": event.target.value, "Due_Date__c": this.items[index].Due_Date__c, "Project_Milestones__c": this.items[index].Project_Milestones__c };
    }
    handleItemDueDate(event) {
        let index = event.target.dataset.index;
        this.items[index] = { "Name": this.items[index].Name, "Due_Date__c": event.target.value, "Project_Milestones__c": this.items[index].Project_Milestones__c };
    }
    handleItemMilestone(event) {
        let index = event.target.dataset.index;
        this.items[index] = { "Name": this.items[index].Name, "Due_Date__c": this.items[index].Due_Date__c, "Project_Milestones__c": event.detail.recordId };
    }

    addItems() {
        this.items.push({
            Name: '',
            Due_Date__c: null,
            Project_Milestones__c: ''
        });
        this.refreshItems();
    }

    removeItems(event) {
        let index = event.target.dataset.index;
        this.items.splice(index, 1);
        this.refreshItems();
    }

    refreshItems() {
        this.itemsToCreate = false;
        this.itemsToCreate = true;
    }

    async handleItems() {
        const allRecords = this.items.map(eachRecord => {
            const recordInput = {
                apiName: ITEM_OBJECT.objectApiName,
                fields: {
                    [ITEM_NAME.fieldApiName]: eachRecord.Name,
                    [ITEM_DUEDATE.fieldApiName]: eachRecord.Due_Date__c,
                    [ITEM_PROJECT.fieldApiName]: eachRecord.Project_Milestones__c
                }
            };
            return createRecord(recordInput);
        });

        try {
            await Promise.all(allRecords);
            this.showToast('success', 'TO DO Items has been created successfully.');
            this.itemsToCreate = false;
        } catch (error) {
            this.showToast('error', JSON.stringify(error));
        }
    }

    showToast(variantMsg, messageToDisplay) {
        const event = new ShowToastEvent({
            variant: variantMsg,
            message: messageToDisplay
        });
        this.dispatchEvent(event);
    }
}