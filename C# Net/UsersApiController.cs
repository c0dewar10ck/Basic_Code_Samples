using log4net;
using Sabio.Models;
using Sabio.Models.Domain;
using Sabio.Models.Requests;
using Sabio.Models.Requests.Users;
using Sabio.Services;
using Sabio.Web.Models.Responses;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Reflection;
using System.Security.Principal;
using System.Threading.Tasks;
using System.Web;
using System.Web.Http;

namespace Sabio.Web.Controllers.Api
{
    [AllowAnonymous]
    [RoutePrefix("api/users")]
    public class UsersApiController : BaseApiController
    {
        private IUserService _service = null;
        private IAuthenticationService<int> _auth;
        private static readonly ILog logger = log4net.LogManager.GetLogger(System.Reflection.MethodBase.GetCurrentMethod().DeclaringType);


        public UsersApiController(IUserService service, IAuthenticationService<int> auth)
        {
            _service = service;
            _auth = auth;

        }

        [Route("login"), HttpPost]
        [AllowAnonymous]
        public HttpResponseMessage LogIn(UserLoginRequest model)
        {
            MethodBase methodName = new StackTrace().GetFrame(0).GetMethod();
            try
            {
                if (!ModelState.IsValid)
                {
                    logger.InfoFormat(@"Executing " + methodName + ". Invalid data sent to server" + ModelState);
                    return CreateErrorResponse();
                }

                ItemResponse<bool> response = new ItemResponse<bool>();
                HttpStatusCode statusCode = HttpStatusCode.OK;
                response.Item = _service.LogIn(model.EmailAddress, model.Password);

                if (!response.Item)
                {
                    logger.InfoFormat(@"Executing " + methodName + ". Failed login attempt. Email: " + model.EmailAddress);
                    return CreateErrorResponse();
                }

                return Request.CreateResponse(statusCode, response);
            }
            catch (Exception e)
            {
                logger.Error("An error occured when executing " + methodName, e);
                return CreateErrorResponse();
            }

        }

        [Authorize(Roles = "Admin")]
        [Route("admin/invite"), HttpPost]
        public async Task<HttpResponseMessage> Create(UserInviteAddRequest model)
        {
            MethodBase methodName = new StackTrace().GetFrame(0).GetMethod();
            try
            {
                if (!ModelState.IsValid)
                {
                    logger.InfoFormat(@"Executing " + methodName + ". Invalid data sent to server" + ModelState);
                    return CreateErrorResponse();
                }

                int modifiedBy = _auth.GetCurrentUserId();
                bool isSuccessful = await _service.Create(model, modifiedBy);

                if (!isSuccessful)
                {
                    logger.InfoFormat(@"Executing " + methodName + ". Error Occured. Emails may not have sent.");
                    return CreateErrorResponse();
                }

                ItemResponse<bool> response = new ItemResponse<bool>();
                response.Item = isSuccessful;
                return Request.CreateResponse(HttpStatusCode.Created, response);
            }
            catch (Exception e)
            {
                logger.Error("An error occured when executing " + methodName, e);
                return CreateErrorResponse();
            }
        }

        [Route, HttpPost]
        [AllowAnonymous]
        public async Task<HttpResponseMessage> Register(UserAddRequest model)
        {
            MethodBase methodName = new StackTrace().GetFrame(0).GetMethod();
            try
            {
                if (!ModelState.IsValid)
                {
                    logger.InfoFormat(@"Executing " + methodName + ". Invalid data sent to server" + ModelState);
                    return CreateErrorResponse();
                }

                ItemResponse<int> responseBody = new ItemResponse<int>();
                responseBody.Item = await _service.Create(model);

                if (responseBody.Item == 0)
                {
                    logger.InfoFormat(@"Executing " + methodName + ". Registration failed. Email: " + model.EmailAddress);
                    return CreateErrorResponse();
                }

                return Request.CreateResponse(HttpStatusCode.Created, responseBody);
            }
            catch (Exception e)
            {
                logger.Error("An error occured when executing " + methodName, e);
                return CreateErrorResponse();
            }
        }

        ...

    }
}