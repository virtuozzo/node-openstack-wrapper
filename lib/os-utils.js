//checks the error and the response code to see if the result of the response call is an error
function isRequestError(error, response)
{
  var return_boolean = false;
  var status_code = 500;
  if(response && response.statusCode)
  {
    status_code = response.statusCode;
  }

  if(error)
  {
    return_boolean = true;
  }
  else if(status_code <= 199 || status_code >= 300)
  {
    return_boolean = true;
  }

  return return_boolean;
}


//when using the request npm to talk to open stack, the errors returned aren't really standardized in a useful way
//so this returns a proper error object based on that info
//caller is just the calling function for logging purposes
//body should be but doesn't have to be json
function getRequestError(error, response, body)
{
  var return_error = null;
  var message = 'Remote Error: ';
  var detail = '';
  var status_code = 500;
  var key = '';
  var remote_error_code = '';
  var remote_message = '';
  var remote_detail = '';
  var remote_method = 'unknown';
  var remote_uri = 'unknown';
  var error_type = 'OpenStack';

  if(error)
  {
    //we have an actual error - just go with that
    return error;
  }
  
  //else try to construct a normal error with status, message, and detail
  //first deal with the status code
  if(response && response.statusCode)
  {
    status_code = response.statusCode;
  }
  
  if(response && response.request && response.request.method)
  {
    remote_method = response.request.method;
  }
  
  if(response && response.request && response.request.uri && response.request.uri.href)
  {
    remote_uri = response.request.uri.href;
  }
  
  //first try to get all the things from a normal payload
  if(body && body.message)
  {
    remote_message = body.message;
  }
  if(body && body.detail)
  {
    remote_detail = body.detail;
  }
  if(body && body.code)
  {
    //note: this is usually same as status for openstack errors but might as well check for it
    remote_error_code = body.code;
  }
  
  //if message is still blank and there is a body - look for an error burried under a propertie like
  //{badRequest: {message: 'blah'}}
  if(body && remote_message == '')
  {
    for(key in body)
    {
      if(body.hasOwnProperty(key) && body[key].hasOwnProperty('message'))
      {
        remote_message = body[key].message;
        if(body[key].detail)
        {
          remote_detail = body[key].detail;
        }
        if(body[key].code)
        {
          remote_error_code = body[key].code;
        }
      }
    }
  }
  
  //if message is still blank and there is a body - just grab all of that
  if(body && remote_message == '')
  {
    remote_message = JSON.stringify(body);
  }
  
  //if its still blank then just do some kind of default message
  if(remote_message == '')
  {
    remote_message = 'An Error Occured';
  }
  
  //now create the error
  return_error = new Error(message + remote_message);
  return_error.status = status_code;

  //add a type to hep error checking if so desired
  return_error.type = error_type;

  //add in the remote details into the details section to debugging
  //might be better as additional properties on the error... for now this is fine though
  detail = 'Remote Method: ' + remote_method + '\nRemote Uri: ' + remote_uri + '\nRemote Details: ' + remote_detail + '\nRemote Status: ' + status_code;
  return_error.detail = detail;

  if(remote_error_code)
  {
    //for now lets pass on whatever error code we get from the remote server call
    return_error.code = remote_error_code;
  }

  return return_error;
}

module.exports = {
  isRequestError: isRequestError,
  getRequestError: getRequestError
}
