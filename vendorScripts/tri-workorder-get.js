// Load compatibility script
load("nashorn:mozilla_compat.js");
load(classLoader.getResource("init.js"));

importPackage(java.lang);
importPackage(java.util);
importPackage(java.text);

//TODO Incomplete - may not be needed


(
	function execute() {

		var log = org.apache.log4j.Logger.getLogger("tri-workorder-get-js");

		var currentDate = new java.util.Date(System.currentTimeMillis());


		var apiHealthResponse = {
			lastUpdatedTime: new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSSZ").format(currentDate),
			status: "Services are operating normally"
		};

		response.setHeader("Content-Type", "application/json");

		response.getWriter().print(JSON.stringify(apiHealthResponse));


	})();

