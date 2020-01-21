console.log('TS.DragAndDrop - NK Version');

/** template elements */
const templProjectInput = document.getElementById("project-input")! as HTMLTemplateElement;
const templSingleProject = document.getElementById("single-project")! as HTMLTemplateElement;
const templProjectList = document.getElementById("project-list")! as HTMLTemplateElement;

/** form inputs */
const inputTitle = document.getElementById("title")! as HTMLInputElement;
const inputDescription = document.getElementById("description")! as HTMLInputElement;
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
