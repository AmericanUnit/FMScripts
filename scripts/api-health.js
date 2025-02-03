// Load compatibility script
load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);



(
	function execute() {
		var log = logger.getLogger("vn-api-health-js");

		var currentDate = new java.util.Date(System.currentTimeMillis());


		var apiHealthResponse = {
			lastUpdatedTime: new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSZ").format(currentDate),
			status: "All services are operating normally"
		};

		var responseJSON = JSON.stringify(apiHealthResponse);

		log.debug(responseJSON)
		response.addHeader("Content-Type", "application/json");

		response.getWriter().print(responseJSON);
		response.getWriter().flush();

	})();

