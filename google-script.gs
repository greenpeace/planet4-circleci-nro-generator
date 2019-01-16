function Initialize() {
 
  try {
 
    var triggers = ScriptApp.getProjectTriggers();
 
    for (var i in triggers)
      ScriptApp.deleteTrigger(triggers[i]);
 
    ScriptApp.newTrigger("SubmitGoogleFormData")
      .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
      .onFormSubmit().create();
 
  } catch (error) {
    throw new Error("Please add this code in the Google Spreadsheet");
  }
}

function SubmitGoogleFormData(e) {
 
  if (!e) {
    throw new Error("Please go the Run menu and choose Initialize");
  }
 
  try {
   //  this is where the API code goes
 
   // grab the columns
      var
        ss = SpreadsheetApp.getActiveSheet(),      // get the active sheet
        lr = ss.getLastRow(),                        // get the last row
        nro = ss.getRange(lr, 2, 1, 1).getValue(), // column 2 NRO Name
        dep = ss.getRange(lr, 3, 1, 1).getValue(), // column 3 Deployment Type: Full or Development
        loc = ss.getRange(lr, 4, 1, 1).getValue(); // column 4 Bucket Location
        d_host = ss.getRange(lr, 5, 1, 1).getValue(); // column 5 Development Hostname
        r_host = ss.getRange(lr, 6, 1, 1).getValue(); // column 6 Release Hostname
        p_host = ss.getRange(lr, 7, 1, 1).getValue(); // column 7 Production Hostname
        build  = ss.getRange(lr, 8, 1, 1).getValue(); // column 8 Build Version
    
    // logic to convert Google form input to what NRO gen expects
    var NROgenMap = { "United States": "us", "European Union": "eu", "Asia": "asia" };

    if (dep == "Full") {
      dev = "true"
      stg = "true"
      prd = "true"
    } else {
      dev = "true"
      stg = "false"
      prd = "false"
    }

    if (loc in NROgenMap) {
      loc = NROgenMap[loc];
    } else {
      loc = undefined
    }
    
    // put columns into API payload
    var prefix = "planet4";
    var payload = [
    {
      "name": "NRO",
      "value": String(nro)
    },
    {
      "name": "MAKE_DEVELOP",
      "value": String(dev)
    },
    {
      "name": "MAKE_RELEASE",
      "value": String(stg)
    },
    {
      "name": "MAKE_MASTER",
      "value": String(prd)
    },
    {
      "name": "STATELESS_BUCKET_LOCATION",
      "value": String(loc)
    },
    {
      "name": "DEVELOPMENT_HOSTNAME",
      "value": String(d_host)
    },
    {
      "name": "RELEASE_HOSTNAME",
      "value": String(r_host)
    },
    {
      "name": "PRODUCTION_HOSTNAME",
      "value": String(p_host)
    },
    {
      "name": "BUILDER_VERSION",
      "value": String(build)
    },
    {
      "name": "APP_HOSTPATH",
      "value": String(nro)
    },
    {
      "name": "GITHUB_REPOSITORY_NAME",
      "value": (prefix.concat('-', nro))
    }
    ];
    
    var build_payload = {
    "branch": "master"
    };

    // set API method URL  - CircleCI ltitus210 circle-test
    var url = "https://circleci.com/api/v1.1/project/github/greenpeace/planet4-circleci-nro-generator/envvar";
    var build_url = "https://circleci.com/api/v1.1/project/github/greenpeace/planet4-circleci-nro-generator/build";
    
    // set up authorization
    var headers = {
      "Authorization" : "Basic " + Utilities.base64Encode('xxxxx:')
    };

    // build up options
    var build_options = {
      'url' : build_url,
      'method': 'post',
      'contentType' : 'application/json',
      'headers': headers,
      'payload': JSON.stringify(build_payload),
      'muteHttpExceptions': false
    };

    var requests = payload.map(function(entry) {
      var options = {
        'url' : url,
        'method': 'post',
        'contentType': 'application/json',
        'headers': headers,
        'payload': JSON.stringify(entry),
        'muteHttpExceptions': false
      };
      return options;
    });

    // make the call
    var response = UrlFetchApp.fetchAll(requests);
    
    // trigger the build
    var build_response = UrlFetchApp.fetch(build_url, build_options);
    
    // log the response (useful for debugging )
    Logger.log(JSON.stringify(response));
    Logger.log(JSON.stringify(build_response));
    
    
  } catch (error) {
    Logger.log(error.toString());
  }
}
