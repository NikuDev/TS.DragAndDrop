console.log("TS.DragAndDrop started!");


/*  Autobind decorator, this is to REPLACE having to call '.bind(this)' on handlers 
   
    this.formEl.bind(this) <- is important so we bind the 'this' that will be used
    in the future (i.e. inside the 'handleSubmit' function), will be the same
    context as in the line below (the instance of ProjectFormInput). If we don't
    do this, the handleSubmit will not work because the 'this' will be pointing to a
    reference of the target or something like that (given by the eventHandler) */
function AutoBind(_:any, _2: string, descriptor: PropertyDescriptor): PropertyDescriptor{
    const originalMethod = descriptor.value;
    const autoBoundPropDescriptor: PropertyDescriptor = {
        configurable: true,
        enumerable: false,
        get() {
            const boundMethod = originalMethod.bind(this);
            return boundMethod;
        }
    }

    return autoBoundPropDescriptor;
}

interface IValidatable {
    value: string | number,
    required?: boolean,
    maxLength?: number,
    minLength?: number,
    max?: number,
    min?: number
}

function validateObject(validatableInput: IValidatable): boolean{
    let isValid = true;

    if(validatableInput.required){
        isValid = isValid && validatableInput.value.toString().length !== 0;
    }

    if(validatableInput.min != null && typeof validatableInput.value === 'number'){
        isValid = isValid && validatableInput.value >= validatableInput.min
    }

    if(validatableInput.max != null && typeof validatableInput.value === 'number'){
        isValid = isValid && validatableInput.value <= validatableInput.max
    }

    if(validatableInput.minLength != null && typeof validatableInput.value === 'string'){
        isValid = isValid && validatableInput.value.toString().length >= validatableInput.minLength
    }

    if(validatableInput.maxLength != null && typeof validatableInput.value === 'string'){
        isValid = isValid && validatableInput.value.toString().length <= validatableInput.maxLength

    }

    return isValid;
}

class ProjectCollection {
    projectListTemplate: HTMLTemplateElement;
    singleProjectTemplate: HTMLTemplateElement;

    divAppHostEl = document.getElementById("app")! as HTMLDivElement;
    
    private projects: Project[] = [];

    constructor(){
        // list template (div containing '<ul>' somewhere)
        this.projectListTemplate = document.getElementById("project-list")! as HTMLTemplateElement;
        // single list element template ('<li>')
        this.singleProjectTemplate = document.getElementById("single-project")! as HTMLTemplateElement;

        // ensure browser compatibility
        if('content' in document.createElement('template')){
            var clone = this.projectListTemplate.content.cloneNode(true);
            
            this.divAppHostEl.appendChild(clone);
        }
    }
    
    public addProject(project: Project) {
        if(!this.hasProject(project)){
            this.projects.push(project);

            this.appendProjectToList();
        }
    }

    appendProjectToList() {
        var clone = this.singleProjectTemplate.content.cloneNode(true)!;
        let liEl = clone.firstChild as HTMLUListElement;
        liEl.textContent = 'hello World!';
        var ulHtmlEl = this.divAppHostEl.querySelector('ul')!;
        // ulHtmlEl.textContent = 'Hello World!';
        ulHtmlEl.appendChild(liEl);
    }
    
    public removeProject(project: Project){
        if (!this.hasProject(project)){
            let indexToRemove = this.projects.indexOf(project);
            
            if(indexToRemove > -1){
                this.projects.splice(indexToRemove, 1);
            }
        }
    }
    
    public getProjects(){
        return this.projects;
    }
    
    private hasProject(project: Project): boolean{
        for(var proj of this.projects){
            if (proj.Title === project.Title &&
                proj.Description === project.Description &&
                proj.People === project.People){
                    return true;
                }
            }
            
        return false;
    }
}

const projectCollection: ProjectCollection = new ProjectCollection();

class ProjectFormInput {
    // Encapsulating elements
    templateFormInputEl: HTMLTemplateElement;
    formEl: HTMLFormElement;
    divAppHostEl: HTMLDivElement; // <- using the more generic 'HTMLElement' would also be fine

    titleInputEl: HTMLInputElement;
    descrTextAreaInputEl: HTMLInputElement;
    peopleInputEl: HTMLInputElement;
    
    /** Initializes the DOM elements needed for the <form> input
     *  note: this should have some null checking in a real application
     */
    constructor() {
        this.templateFormInputEl = document.getElementById('project-input')! as HTMLTemplateElement;
        this.divAppHostEl = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateFormInputEl.content, true);
        this.formEl = importedNode.firstElementChild as HTMLFormElement;
        /** 'user-input' is a defined style in the app.css, we apply styling by 
         * setting the id here, but it could also be hard-coded in the html
         */
        this.formEl.id = 'user-input'; 

        this.titleInputEl = this.formEl.querySelector("#title") as HTMLInputElement;
        this.descrTextAreaInputEl = this.formEl.querySelector("#description") as HTMLInputElement;
        this.peopleInputEl = this.formEl.querySelector("#people") as HTMLInputElement;

        this.registerHandlers();

        // We've finished setting everything we need for the form, render it
        this.renderFormElement();
    }

    private registerHandlers() {
           this.formEl.addEventListener('submit', this.handleSubmit);
    }
    
    private renderFormElement() {
        this.divAppHostEl.insertAdjacentElement('afterbegin', this.formEl);
    }

    @AutoBind
    private handleSubmit(event: Event) {
        // start with preventing sending of a HTTPRequest (and thus reloading of the page)
        event.preventDefault();
        
        let formInputValues = this.getFormInput();
        if(Array.isArray(formInputValues)){
            let title = formInputValues[0];
            let description = formInputValues[1];
            let people = formInputValues[2];

            let createdProject = new Project(title, description, people);
    
            // validateInput
            if (!validateObject({ value: title, required: true, minLength: 2, maxLength: 10 }) ||
                !validateObject({ value: description, required: true, maxLength: 128 }) ||
                !validateObject({ value: people, min: 3, max: 10 })){
                alert('Invalid Input!');
                return;
            } else {
                projectCollection.addProject(createdProject);
                console.log(`Project created: ${createdProject.Title}`);
                this.clearInput();
            }
        }
    }

    private getFormInput(): [string, string, number] | void {
        let title = this.titleInputEl.value;
        let description = this.descrTextAreaInputEl.value;
        let peopleStr = this.peopleInputEl.value;

        return [title, description, +peopleStr];
    }

    private clearInput(){
        this.titleInputEl.value = '';
        this.descrTextAreaInputEl.value = '';
        this.peopleInputEl.value = '';
    }
}

class Project {
    private _title: string = '';

    get Title() {
        return this._title;
    }
    
    set Title(value: string){
        if(value.length <= 0){
            console.warn('Title must be > 0 characters long');
            return;
        }

        this._title = value;
    }

    private _description: string;

    get Description() {
        return this._description;
    }

    set Description(value) {
        if(value.length <= 0){
            console.warn('Descr must be > 0 characters long');
            return;
        }

        this._description = value;
    }

    private _people: number;

    get People() {
        return this._people;
    }

    set People(value) {
        if(value >= 0){
            console.warn('Only positive number of People allowed');
            return;
        }

        this._people = value;
    }

    constructor(title: string, description: string, people: number) {
        this._title = title;
        this._description = description;
        this._people = people;
    }
}

const renderedFormInput = new ProjectFormInput();


