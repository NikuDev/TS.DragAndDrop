console.log("TS.DragAndDrop started!");

/** The global 'crud manager' for handling the content of the
 *  rendered project lists
 */
class ProjectStateManager {
	private projects: Project[] = [];
	private listeners: Function[] = [];
	private static _instance: ProjectStateManager;

	// declare the ctor as private for the singleton pattern
	private constructor() {}

	public static getInstance(): ProjectStateManager {
		if (!ProjectStateManager._instance) {
			this._instance = new ProjectStateManager();
		}

		return this._instance;
	}

	public addListener(listener: Function) {
		this.listeners.push(listener);
	}

	public addProject(project: Project) {
		if (!this.hasProject(project)) {
			this.projects.push(project);

			/** The collection changed, let's notify all the listeners */
			for (const listener of this.listeners) {
				/** (using .slice() ensures only a COPY of the array is used) */
				listener(this.projects.slice());
			}

			// this.appendProjectToRenderedList();
		}
	}

	appendProjectToRenderedList() {
		// this.renderedProjectList.addStuffToTheList
		// var clone = this.templateProjectList.content.cloneNode(true)!;
		// let liEl = clone.firstChild as HTMLUListElement;
		// liEl.textContent = 'hello World!';
		// var ulHtmlEl = this.divAppHostEl.querySelector('ul')!;
		// // ulHtmlEl.textContent = 'Hello World!';
		// ulHtmlEl.appendChild(liEl);
	}

	public removeProject(project: Project) {
		if (!this.hasProject(project)) {
			let indexToRemove = this.projects.indexOf(project);

			if (indexToRemove > -1) {
				this.projects.splice(indexToRemove, 1);
			}
		}
	}

	public getProjects() {
		return this.projects;
	}

	private hasProject(project: Project): boolean {
		for (var proj of this.projects) {
			if (
				proj.Title === project.Title &&
				proj.Description === project.Description &&
				proj.People === project.People
			) {
				return true;
			}
		}

		return false;
	}
}

/** Now that we've defined the managing class, let's create a global instance
 *  so it can be used inside the classes responsible for rendering the HTML/UI.
 *  (optionally use a singleton like so to guarantee only 1 collection/statemanager during runtime)
 */
const projectStateManager: ProjectStateManager = ProjectStateManager.getInstance();

/*  Autobind decorator, this is to REPLACE having to call '.bind(this)' on handlers 
   
    this.formEl.bind(this) <- is important so we bind the 'this' that will be used
    in the future (i.e. inside the 'handleSubmit' function), will be the same
    context as in the line below (the instance of ProjectFormInput). If we don't
    do this, the handleSubmit will not work because the 'this' will be pointing to a
    reference of the target or something like that (given by the eventHandler) */
function AutoBind(
	_: any,
	_2: string,
	descriptor: PropertyDescriptor
): PropertyDescriptor {
	const originalMethod = descriptor.value;
	const autoBoundPropDescriptor: PropertyDescriptor = {
		configurable: true,
		enumerable: false,
		get() {
			const boundMethod = originalMethod.bind(this);
			return boundMethod;
		}
	};

	return autoBoundPropDescriptor;
}

function validateObject(validatableInput: IValidatable): boolean {
	let isValid = true;

	if (validatableInput.required) {
		isValid = isValid && validatableInput.value.toString().length !== 0;
	}

	if (
		validatableInput.min != null &&
		typeof validatableInput.value === "number"
	) {
		isValid = isValid && validatableInput.value >= validatableInput.min;
	}

	if (
		validatableInput.max != null &&
		typeof validatableInput.value === "number"
	) {
		isValid = isValid && validatableInput.value <= validatableInput.max;
	}

	if (
		validatableInput.minLength != null &&
		typeof validatableInput.value === "string"
	) {
		isValid =
			isValid &&
			validatableInput.value.toString().length >=
				validatableInput.minLength;
	}

	if (
		validatableInput.maxLength != null &&
		typeof validatableInput.value === "string"
	) {
		isValid =
			isValid &&
			validatableInput.value.toString().length <=
				validatableInput.maxLength;
	}

	return isValid;
}

interface IValidatable {
	value: string | number;
	required?: boolean;
	maxLength?: number;
	minLength?: number;
	max?: number;
	min?: number;
}

/** An instance will render a <ul> Project list based
 *  on the <ul> outlined within the <template> tags
 */
class RenderedProjectList {
	templateProjectList: HTMLTemplateElement;
	templateSingleProject: HTMLTemplateElement;
	divAppHostEl: HTMLDivElement;

	// there is no explicit 'HTMLSectionElement', so we can use HTMLElement
	projectListSectionEl: HTMLElement;

	// assigned project for the listener function
	currentProjects: Project[] = [];

	constructor(private type: "active" | "finished") {
		// list template (div containing '<ul>' somewhere)
		this.templateProjectList = document.getElementById(
			"project-list"
		)! as HTMLTemplateElement;
		// single list element template ('<li>')
		this.templateSingleProject = document.getElementById(
			"single-project"
		)! as HTMLTemplateElement;
		this.divAppHostEl = document.getElementById("app")! as HTMLDivElement;

		const importedNode = document.importNode(
			this.templateProjectList.content,
			true
		);
		this.projectListSectionEl = importedNode.firstElementChild as HTMLElement;

		// let's apply a style based on whether the projectlist is 'active' or 'finished'
		this.projectListSectionEl.id = `${type}-projects`;

		/** we want to register the renderedElement as a subscribed 'listener' to when
		 * the collection changes.
		 *
		 * we /know/ that the 'addListener' function in the stateManager will expect
		 * a 'listenerFunction', that will ultimately be used to return the projects
		 * to the listeners (this instance for example), that's why we can define 'projects'
		 * with the correct returntype
		 */
		projectStateManager.addListener((projectsCopy: Project[]) => {
			this.currentProjects = projectsCopy;
			this.notifyProjectsChanged();
		});

		this.renderProjectList();
		this.renderContent();
	}

	private renderProjectList() {
		this.divAppHostEl.insertAdjacentElement(
			"beforeend",
			this.projectListSectionEl
		);
	}

	private renderContent() {
		/* to be able to access the <ul> later, we want to use a specific id (based on type in this case) */
		const listId = `${this.type}-project-list`;
		/* get the first (and only) <ul> and set the id */
		this.projectListSectionEl.querySelector("ul")!.id = listId;
		/* set the header to the used type, i.e. 'ACTIVE PROJECTS' */
		this.projectListSectionEl.querySelector("h2")!.textContent =
			this.type.toString().toUpperCase() + " PROJECTS";
	}

	/** this func should be called whenever the listener (this class) gets
	 * notified that the projectlist has changed. We want to (re)populate
	 * the <ul> element whenever the collection changes, of which (at this point)
	 * we know the id it's using - as defined in renderContent()
	 */
	private notifyProjectsChanged() {
		const ulEl = document.getElementById(
			`${this.type}-project-list`
		)! as HTMLUListElement;
		/** we have the element, lets populate it with each project in the placedholder coll */
		for (const proj of this.currentProjects) {
			const liEl = document.createElement("li");
			liEl.textContent = proj.Title;
			ulEl.appendChild(liEl);
		}
	}
}

/** An instance will render a <form> including handling of the submit button
 *  based on the <form> outlined within the <template> tags
 */
class RenderedProjectFormInput {
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
		this.templateFormInputEl = document.getElementById(
			"project-input"
		)! as HTMLTemplateElement;
		this.divAppHostEl = document.getElementById("app")! as HTMLDivElement;

		const importedNode = document.importNode(
			this.templateFormInputEl.content,
			true
		);
		this.formEl = importedNode.firstElementChild as HTMLFormElement;
		/** 'user-input' is a defined style in the app.css, we apply styling by
		 * setting the id here, but it could also be hard-coded in the html
		 */
		this.formEl.id = "user-input";

		this.titleInputEl = this.formEl.querySelector(
			"#title"
		) as HTMLInputElement;
		this.descrTextAreaInputEl = this.formEl.querySelector(
			"#description"
		) as HTMLInputElement;
		this.peopleInputEl = this.formEl.querySelector(
			"#people"
		) as HTMLInputElement;

		this.registerHandlers();

		// We've finished setting everything we need for the form, render it
		this.renderFormElement();
	}

	private registerHandlers() {
		this.formEl.addEventListener("submit", this.handleSubmit);
	}

	private renderFormElement() {
		this.divAppHostEl.insertAdjacentElement("afterbegin", this.formEl);
	}

	@AutoBind
	private handleSubmit(event: Event) {
		// start with preventing sending of a HTTPRequest (and thus reloading of the page)
		event.preventDefault();

		let formInputValues = this.getFormInput();
		if (Array.isArray(formInputValues)) {
			let title = formInputValues[0];
			let description = formInputValues[1];
			let people = formInputValues[2];

			let createdProject = new Project(title, description, people);

			// validateInput
			if (
				!validateObject({
					value: title,
					required: true,
					minLength: 2,
					maxLength: 10
				}) ||
				!validateObject({
					value: description,
					required: true,
					maxLength: 128
				}) ||
				!validateObject({ value: people, min: 3, max: 10 })
			) {
				alert("Invalid Input!");
				return;
			} else {
				console.log(
					`Project succesfully created: ${createdProject.Title}`
				);
				this.addProjectToList(createdProject);
				this.clearInput();
			}
		}
	}

	private addProjectToList(project: Project) {
		projectStateManager.addProject(project);
	}

	private getFormInput(): [string, string, number] | void {
		let title = this.titleInputEl.value;
		let description = this.descrTextAreaInputEl.value;
		let peopleStr = this.peopleInputEl.value;

		return [title, description, +peopleStr];
	}

	private clearInput() {
		this.titleInputEl.value = "";
		this.descrTextAreaInputEl.value = "";
		this.peopleInputEl.value = "";
	}
}

/** POCO for handling 'Projects' from the form */
class Project {
	private _id: string;

	get Id() {
		return this._id;
	}

	private _title: string = "";

	get Title() {
		return this._title;
	}

	set Title(value: string) {
		if (value.length <= 0) {
			console.warn("Title must be > 0 characters long");
			return;
		}

		this._title = value;
	}

	private _description: string;

	get Description() {
		return this._description;
	}

	set Description(value) {
		if (value.length <= 0) {
			console.warn("Descr must be > 0 characters long");
			return;
		}

		this._description = value;
	}

	private _people: number;

	get People() {
		return this._people;
	}

	set People(value) {
		if (value >= 0) {
			console.warn("Only positive number of People allowed");
			return;
		}

		this._people = value;
	}

	constructor(title: string, description: string, people: number) {
		this._id = Math.random().toString();
		this._title = title;
		this._description = description;
		this._people = people;
	}
}

const renderedFormInput = new RenderedProjectFormInput();

const activeProjectCollection: RenderedProjectList = new RenderedProjectList(
	"active"
);
const finishedProjectCollection: RenderedProjectList = new RenderedProjectList(
	"finished"
);
