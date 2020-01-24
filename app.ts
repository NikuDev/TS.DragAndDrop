console.log("TS.DragAndDrop started!");

/** To improve readability and typechecking, we'll
 *  define an Enum for the status of a project (instead of
 *  using strings to define it)
 */
enum StatusEnum {
    active,
    finished
}

/** To improve readability and make it explicit,
 *  we define a 'Listener' type that takes an Array of Project's
 *  and does not return anything
 */
type Listener<T> = (items: T[]) => void;

abstract class StateManager<T> {
	protected listeners: Listener<T>[] = [];

	public addListener(listener: Listener<T>) {
		this.listeners.push(listener);
	}
}

/** Holds the collection of <Project>'s and exposes
 *  CRUD functionality regarding <Project>'s
 */
class ProjectStateManager extends StateManager<Project> {
	private projects: Project[] = [];
	private static _instance: ProjectStateManager;

	// declare the ctor as private for the singleton pattern
	private constructor() { super(); }

	public static getInstance(): ProjectStateManager {
		if (!ProjectStateManager._instance) {
			this._instance = new ProjectStateManager();
		}

		return this._instance;
	}

	public addProject(project: Project) {
		if (!this.hasProject(project)) {
			this.projects.push(project);

			/** The collection changed, let's notify all the listeners */
			for (const listener of this.listeners) {
				/** (using .slice() ensures only a COPY of the array is used) */
				listener(this.projects.slice());
			}
		}
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
				console.warn('This project already exists!')
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

// Drag & Drop interfaces
interface IDraggable {
	dragStartHandler(event: DragEvent): void;
	dragEndHandler(event: DragEvent): void;
}

interface IDragTarget {
	/** When a IDraggable hovers over a target (i.e. style changes) */
	dragOverHandler(event: DragEvent): void;
	/** Handling the drop (status update on the IDraggable etc.) */
	dropHandler(event: DragEvent): void;
	/** When a IDraggable leaves a target (i.e. style changes) */
	dragLeaveHandler(event: DragEvent): void;
}

/** Can be used on any class that wants to be rendered in the DOM
 *  T = HostElement (i.e. HTMLDivElement)
 *  U = uiElement to be rendered (i.e. HTMLFormElement)
 */
abstract class UIComponent<T extends HTMLElement, U extends HTMLElement> {
    templateElement: HTMLTemplateElement;
    hostElement: T;
    uiElement: U;

    constructor(
        templateElementId: string,
        hostElementId: string,
        insertionPoint: 'afterbegin' | 'beforeend',
        uiElementId?: string // optional
    ) {
		this.templateElement = document.getElementById(templateElementId)! as HTMLTemplateElement;
		this.hostElement = document.getElementById(hostElementId)! as T;

		const importedNode = document.importNode(
			this.templateElement.content,
			true
		);
        this.uiElement = importedNode.firstElementChild as U;

        if(uiElementId)
            this.uiElement.id = uiElementId;

        this.addUIElementToHost(insertionPoint);
    }

	private addUIElementToHost(insertionPoint: 'afterbegin' | 'beforeend') {
		this.hostElement.insertAdjacentElement(
			insertionPoint,
			this.uiElement
		);
	}

	/** Separate function for adding additional functionality to the element
	 *  we want to render (i.e. adding event listeners)
	 */
	abstract configure(): void;

	/** Separate function to render the element in the DOM (i.e. inserting it
	 *  in the host element)
	 */
	abstract renderElement(): void;
}

/** An instance will render a <ul> Project list based
 *  on the <ul> outlined within the <template> tags
 */
class RenderedProjectList
		extends UIComponent<HTMLDivElement, HTMLElement>
		implements IDragTarget {
	// assigned project for the listener function
	activeProjects: Project[] = [];

	constructor(private status: StatusEnum) {
		super('project-list', 'app', 'beforeend', `${StatusEnum[status]}-projects`);

		this.configure();
		this.renderElement();
	}

	configure(){

		this.uiElement.addEventListener('dragover', this.dragOverHandler);
		this.uiElement.addEventListener('dragleave', this.dragLeaveHandler);
		this.uiElement.addEventListener('drop', this.dropHandler);

		/** we want to register the renderedElement as a subscribed 'listener' to when
		 * the collection changes.
		 *
		 * we /know/ that the 'addListener' function in the stateManager will expect
		 * a 'listenerFunction', that will ultimately be used to return the projects
		 * to the listeners (this instance for example), that's why we can define 'projects'
		 * with the correct returntype.
		 *
		 * At this point, we are only interested in the 'active' projects, we could
		 * use a simple if(status = active), or use .filter on the collection and filter out
		 * the objects with status.Active;
		 */
		projectStateManager.addListener((projectsCopy: Project[]) => {
			const temp = projectsCopy.filter(proj => {
				if(this.status === StatusEnum.active){
					return proj.Status === StatusEnum.active;
				}

				return proj.Status === StatusEnum.finished;
			});
			this.activeProjects = temp;
            this.notifyProjectsChanged();
		})
	}

	renderElement() {
		/* to be able to access the <ul> later, we want to use a specific id (based on type in this case) */
		const listId = `${StatusEnum[this.status]}-project-list`;
		/* get the first (and only) <ul> and set the id */
		this.uiElement.querySelector("ul")!.id = listId;
		/* set the header to the used type, i.e. 'ACTIVE PROJECTS' */
		this.uiElement.querySelector("h2")!.textContent =
		StatusEnum[this.status].toString().toUpperCase() + " PROJECTS";
	}

	/** this func should be called whenever the listener (this class) gets
	 * notified that the projectlist has changed. We want to (re)populate
	 * the <ul> element whenever the collection changes, of which (at this point)
	 * we know the id it's using - as defined in renderContent()
	 */
	private notifyProjectsChanged() {
		const ulEl = document.getElementById(`${StatusEnum[this.status]}-project-list`)! as HTMLUListElement;
        /** for this small project, we can get away with clearing the <ul> before we start
		 *  adding all projects again (to prevent duplicates). In a bigger application this might
		 *  be performance-costly
         */

		ulEl.innerHTML = '';
		/** we have the element, lets populate it with each project in the placedholder coll */
		for (const proj of this.activeProjects) {
			new RenderedProjectItem(proj, ulEl.id);
		}
	}

	@AutoBind
	dragOverHandler(event: DragEvent): void {
		const ulEl = this.uiElement.querySelector('ul')!;
		ulEl.classList.add('droppable');
	}
	dropHandler(event: DragEvent): void {
		console.warn('dropHandler triggered!');
	}
	@AutoBind
	dragLeaveHandler(event: DragEvent): void {
		const ulEl = this.uiElement.querySelector('ul')!;
		ulEl.classList.remove('droppable');
	}
}

/** An instance will render a <form> including handling of the submit button
 *  based on the <form> outlined within the <template> tags
 */
class RenderedProjectFormInput extends UIComponent<HTMLDivElement, HTMLFormElement>{
	titleInputEl: HTMLInputElement;
	descrTextAreaInputEl: HTMLInputElement;
	peopleInputEl: HTMLInputElement;

	/** Initializes the DOM elements needed for the <form> input
	 *  note: this should have some null checking in a real application
	 */
	constructor() {
		super('project-input', 'app', 'afterbegin', 'user-input');

		this.titleInputEl = this.uiElement.querySelector(
			"#title"
		) as HTMLInputElement;
		this.descrTextAreaInputEl = this.uiElement.querySelector(
			"#description"
		) as HTMLInputElement;
		this.peopleInputEl = this.uiElement.querySelector(
			"#people"
		) as HTMLInputElement;

		this.configure();

		// We've finished setting everything we need for the form, render it
		this.renderElement();
	}

	/** Adding (optional) information to the element we want to render */
	configure() {
		this.uiElement.addEventListener("submit", this.handleSubmit);
	}

	renderElement() {
		this.hostElement.insertAdjacentElement("afterbegin", this.uiElement);
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

			let createdProject = new Project(title, description, people, StatusEnum.active);

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
				!validateObject({ value: people, min: 0, max: 10 })
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

class RenderedProjectItem
		extends UIComponent<HTMLUListElement, HTMLLIElement>
		implements IDraggable {

	constructor(private project: Project, hostElementId: string){
		super('single-project', hostElementId, 'beforeend', project.Id);

		this.configure();
		this.renderElement();
	}

	configure(){
		// let's define the functions that should be triggered on certain events of this ui-item
		this.uiElement.addEventListener('dragstart', this.dragStartHandler);
		this.uiElement.addEventListener('dragend', this.dragEndHandler);
	}

	renderElement(){
		let noPeople = this.project.People;
		this.uiElement.querySelector('h2')!.textContent = `${this.project.Title}`;
		this.uiElement.querySelector('h3')!.textContent = `${this.project.Description}`;
		this.uiElement.querySelector('p')!.textContent =
			noPeople === 1 ? `${noPeople} person assigned` : `${noPeople} persons assigned`;
		this.hostElement.appendChild(this.uiElement);
	}

	@AutoBind
	dragStartHandler(event: DragEvent): void {
		console.warn('dragStartHandler triggered!');
	}

	@AutoBind
	dragEndHandler(event: DragEvent): void {
		console.warn('dragEndHandler triggered!');
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

    private _status: StatusEnum;

    get Status(){
        return this._status;
    }

    set Status(value){
        this._status = value;
    }

	constructor(title: string, description: string, people: number, type: StatusEnum) {
		this._id = Math.random().toString();
		this._title = title;
		this._description = description;
        this._people = people;
        this._status = type;
	}
}

const renderedFormInput = new RenderedProjectFormInput();

const activeProjectCollection: RenderedProjectList =
    new RenderedProjectList(StatusEnum.active);
const finishedProjectCollection: RenderedProjectList =
    new RenderedProjectList(StatusEnum.finished);
