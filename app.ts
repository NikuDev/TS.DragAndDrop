console.log("TS.DragAndDrop started!");

class ProjectFormInput {
  templateFormInputEl: HTMLTemplateElement;
  divAppHostEl: HTMLDivElement; // <- using the more generic 'HTMLElement' would also be fine
  formEl: HTMLFormElement;

  
  /** Initializes the DOM elements needed for the <form> input
   *  note: this should have some null checking in a real application
   */
  constructor() {
        this.templateFormInputEl = document.getElementById('project-input')! as HTMLTemplateElement;
        this.divAppHostEl = document.getElementById('app')! as HTMLDivElement;

        const importedNode = document.importNode(this.templateFormInputEl.content, true);
        this.formEl = importedNode.firstElementChild as HTMLFormElement;
        this.formEl.id = 'user-input';
        this.renderFormElement();
    }
    
    private renderFormElement() {
        this.divAppHostEl.insertAdjacentElement('afterbegin', this.formEl);
    }
}

const renderedFormInput = new ProjectFormInput();


