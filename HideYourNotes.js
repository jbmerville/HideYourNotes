function onOpen() {
	DocumentApp.getUi().createAddonMenu()
		.addItem("Hide", "showSidebar")
		.addToUi();
}

function showSidebar() {
	var ui = HtmlService.createHtmlOutputFromFile("addon")
		.setTitle("Hide Your Notes");
	DocumentApp.getUi().showSidebar(ui);
}

function onInstall(e) {
	onOpen(e);
}

function hide(hideOrShow, attributes){
	var fontColors;
	if(attributes[6] != false && attributes[6].length > 5) {
		fontColors = attributes[6];
		fontColors = fontColors.split(".");
	}
	if(attributes[4] == "ARIAL") attributes[4] = null; 
	var childArray = new getDocText();
	if(hideOrShow) {
		var highlightStyle = {};
		highlightStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = "#ffffff";
		for(let n = 0; n < childArray.length; n++){
			var text = childArray[n].asText(); 
			var index = childArray[n].getTextAttributeIndices(); 
			for(let i = 0; i < index.length; i++) {
				var atts = text.getAttributes(index[i]);
				var lengthText = text.getText().length - 1;
				if (attributes[9]) {
					if ((!attributes[0] || !atts["ITALIC"]) && (!attributes[1] || !atts["BOLD"]) && (!attributes[2] || !atts["UNDERLINE"]) && (!attributes[4] && atts["FONT_FAMILY"] != attributes[4]) && (!attributes[5] || atts["FONT_SIZE"] != attributes[5])) {
						text.setAttributes(index[i], (index[i+1] == undefined? textLength: index[i+1]), highlightStyle);
					} 
				} else {
					if( (attributes[0] && atts["ITALIC"]) || (attributes[1] && atts["BOLD"]) || (attributes[2] && atts["UNDERLINE"]) || (attributes[4] && atts["FONT_FAMILY"] == attributes[4]) || (attributes[5] && atts["FONT_SIZE"] == attributes[5]))	{
						text.setAttributes(index[i], (index[i+1] == undefined? textLength: index[i+1]), highlightStyle);
					}
					if(attributes[6])
					{
						lengthText = text.getText().length - 1;
						for(let x = 1; x <= fontColors.length; x++) {
							if(atts["FOREGROUND_COLOR"] == fontColors[x] && hideOrShow) text.setAttributes(index[i], lengthText, highlightStyle);
						}
					}
				}
			}
		}
	} else
	{
		var highlightStyle = {};
		highlightStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = "#000000";
		for(let n = 0; n < childArray.length; n++){
			var text = childArray[n].asText(); 
			var index = childArray[n].getTextAttributeIndices();
			var lengthText = text.getText().length - 1;
			for(let i = 0; i <index.length; i++)
			{
				text.setAttributes(index[i], (index[i+1] == undefined? textLength: index[i+1]), highlightStyle);
			}
		}
	}
	if (attributes[3]) showEquations(hideOrShow);
	if (attributes[7]) showImages(hideOrShow);
	if (attributes[8]) showSelected(hideOrShow);
}


// Scan the whole document and returns every Text objects in an array.
function getDocText(){  
	var body = DocumentApp.getActiveDocument().getBody();
	var paragraph = body.getParagraphs();
	var lengthPara = paragraph.length;
	var childsArray = [];
	for(let n = 0; n < lengthPara; n++)
	{
		var childNum = paragraph[n].getNumChildren();
		for(let x = 0; x < childNum; x++)
		{
			var type = paragraph[n].getChild(x).getType();
			if(paragraph[n].getChild(x).getType() == DocumentApp.ElementType.TEXT)
			{
				childsArray.push(paragraph[n].getChild(x));
			}
		} 
	}
	return childsArray;
}

// Scan the whole document to get every attributes used. Returns the fonts, colors and backgroundColor depending on which category is requested.  
function getDocAttributes(category){
	var childArray = new getDocText();
	var colors = [];
	var fontSize = [];
	var backgroundColor = [];
	for(let n = 0; n < childArray.length; n++){
		var text = childArray[n].asText();
		var index = childArray[n].getTextAttributeIndices();
		for(let i = 0; i < index.length; i++)
		{
			var atts = text.getAttributes(index[i]);
			for (let att in atts) 
			{
				if(att == "FOREGROUND_COLOR" && atts[att] != null && colors.indexOf(atts[att]) == -1 )
				{
					colors.push(atts[att]);
				}
				else if(att == "FONT_SIZE" && atts[att] != null && fontSize.indexOf(atts[att]) == -1 )
				{
					fontSize.push(atts[att]);
				}
				else if(att == "BACKGROUND_COLOR" && atts[att] != null && backgroundColor.indexOf(atts[att]) == -1 )
				{
					backgroundColor.push(atts[att]);
				}
			}
		}
	}
	if(category == 1) return fontSize;
	if(category == 2) return colors;
	if(category == 3) return backgroundColor;
}

// Hide or show the images in the document.
function showImages(toShow) {
	var body = DocumentApp.getActiveDocument().getBody();
	var images = null;
	var width = [];
	if (!toShow) width = JSON.parse(PropertiesService.getDocumentProperties().getProperty("WIDTH"));
	let i = 0;
	while (images = body.findElement( DocumentApp.ElementType.INLINE_IMAGE, images)){
		if (images) {
			var pictureStyle = {};
			if (toShow) {
				pictureStyle[DocumentApp.Attribute.WIDTH] = 0;
				atts = images.getElement().getAttributes();
				if ("WIDTH" in atts) width.push(atts["WIDTH"]); 
				else Logger.log("Picture has no WIDTH attribute");
			}
			else {
				if (width[i]) pictureStyle[DocumentApp.Attribute.WIDTH] = width[i];
				else pictureStyle[DocumentApp.Attribute.WIDTH] = images.getElement().getAttributes()["HEIGHT"];
				i++;
			}
			images.getElement().setAttributes(pictureStyle);
		}
	}
	if (toShow) saveImagesWidth(width);
}

// Save the width of images in the document in a PropertyService object. The width of images is changed to hide and show the images.
function saveImagesWidth(width) {
	var documentProperties = PropertiesService.getDocumentProperties();
	documentProperties.setProperty("WIDTH", JSON.stringify(width));
}

// Hide or show the equations elements in the document.
function showEquations(toShow) {
	var body = DocumentApp.getActiveDocument().getBody();
	var equations = null;
  
	// Loop through all the equation in the document. When equations is null we have looped through all of them.
	while (equations = body.findElement(DocumentApp.ElementType.EQUATION, equations)) {
		if (equations) {
			var equationStyle = {};
			if (toShow) {
				equationStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = "#ffffff";
			}
			else {
				equationStyle[DocumentApp.Attribute.FOREGROUND_COLOR] = "#000000";
			}
			equations.getElement().setAttributes(equationStyle);
		}
	}
}

// Hide or show the text elements selected.
function showSelected(toShow) {
	var selection = DocumentApp.getActiveDocument().getSelection();
	var color = "#000000";
	if (toShow) color = "#ffffff";
	if (selection) {
		var elements = selection.getRangeElements();
		for (let i = 0; i < elements.length; i++) {
			var element = elements[i];
      
			// Only modify elements that can be edited as text; skip images and other non-text elements.
			if (element.getElement().editAsText) {
				var text = element.getElement().editAsText();
        
				// Bold the selected part of the element, or the full element if it's completely selected.
				if (element.isPartial()) {
					text.setForegroundColor(element.getStartOffset(), element.getEndOffsetInclusive(), color);
				} else {
					text.setForegroundColor(color);
				}
			}
		}
	}
}