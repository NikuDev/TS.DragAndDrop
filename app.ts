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

        let title = this.titleInputEl.value;
        let description = this.descrTextAreaInputEl.value;
        let people = this.peopleInputEl.value;

        let project = new Project();
        project.title = title;
        project.description = description;
        project.people = +people;

        console.log(`Project created: ${project.title}`);
    }
}

class Project{
    // Input element
    title: string = '';
    description: string = '';
    people: number = 0;
}

const renderedFormInput = new ProjectFormInput();


