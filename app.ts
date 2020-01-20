console.log('TS.DragAndDrop..!');

/** Form that handles 'new project input' */
const templProjectInput = document.getElementById("project-input")! as HTMLTemplateElement;
/** <li> element to display a single project */
const templSingleProject = document.getElementById("single-project")! as HTMLTemplateElement;
/** <ul> element to display a list of all projects */
const templProjectList = document.getElementById("project-list")! as HTMLTemplateElement;

/** form input */
const inputTitle = document.getElementById("title")! as HTMLInputElement;
/** form input */
const inputDescription = document.getElementById("description")! as HTMLInputElement;
/** form input */
const inputPeople = document.getElementById("people")! as HTMLInputElement;

/** main <div> for rendering the output of the .ts contents */
const divAppHost = document.getElementById("app")! as HTMLDivElement;

/** to render the contents of a <template>, let's create a clone and append it to
 *  the <div "app"></div> to render it on screen.
 * 
 * (checking if 'content' exists on the 'template' element ensures browser compatibility
 *  source: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/template)
 */
if('content' in document.createElement('template')){
    var clone = templProjectInput.content.cloneNode(true);

    divAppHost.appendChild(clone);
}
