//load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

function execute() {

	var FMUtil = Java.type("com.deloitte.tririga.common.FMUtil")

	var relativeURI = request.getRequestURI();

	var resource = "swagger-ui" + request.getRequestURI().substring(request.getRequestURI().lastIndexOf('/'));

	var responseHtml;

	try {
		responseHtml = FMUtil.getResourceAsText(resource);

	} finally {

		if (responseHtml == null ){
			response.sendError(org.apache.http.HttpStatus.SC_NOT_FOUND, "Resource Not Found");
			return;
		}
	}

	var contentType = request.getSession().getServletContext().getMimeType(resource);

	response.setContentType(contentType);
	response.setHeader("Content-Type", contentType);
	response.getWriter().print(responseHtml);
}

execute();



