using BCrypt;
using Sabio.Data;
using Sabio.Data.Providers;
using Sabio.Models;
using Sabio.Models.Domain;
using Sabio.Models.Requests;
using Sabio.Models.Requests.Users;
using Sabio.Services.Cryptography;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;
using System.Web;

namespace Sabio.Services
{
    public class UserService : IUserService
    {
        private IAuthenticationService<int> _authenticationService;
        private IDataProvider _dataProvider;
        private IEmailService _emailService;

        public UserService(IAuthenticationService<int> authSerice, IDataProvider dataProvider, IEmailService emailService)
        {
            _authenticationService = authSerice;
            _dataProvider = dataProvider;
            _emailService = emailService;
        }

        public bool LogIn(string email, string password)
        {
            bool isSuccessful = false;

            IUserAuthData response = Get(email, password);

            if (response != null)
            {
                _authenticationService.LogIn(response);
                isSuccessful = true;
            }


            return isSuccessful;

        }

        public bool ExternalLogIn(ExtUserAddRequest data, UserStatus status = UserStatus.Active)
        {
            bool isSuccessful = false;
            bool response = Create(data, status);
            IUserAuthData authUser = null;

            if (response)
            {
                authUser = Get(data.EmailAddress);
            }

            if (authUser != null)
            {
                _authenticationService.LogIn(authUser);
                isSuccessful = true;
            }

            return isSuccessful;

        }

        public void LogOut()
        {
            _authenticationService.LogOut();

        }

        public IUserAuthData Get(string email, string password)
        {
            UserBase authUser = null;
            List<string> roles = null;
            List<string> challenges = null;
            string procName = "[dbo].[Users_SelectByEmail_V7]";
            _dataProvider.ExecuteCmd(procName
                   , delegate (SqlParameterCollection paramCollection)
                   {
                       paramCollection.AddWithValue("@EmailAddress", email);
                   }
                   , singleRecordMapper: delegate (IDataReader reader, short set)
                   {
                       string passwordFromDb = GetPassword(email);
                       bool isSuccessful = BCrypt.Net.BCrypt.Verify(password, passwordFromDb);
                       bool isConfirmed = CheckConfirmation(email);

                       if (isSuccessful && isConfirmed)

                           CurrentUserMap(reader, set, ref authUser, ref roles, ref challenges);
                   }
                   );
            if (authUser != null)
            {
                Update(authUser.Id, DateTime.Now);
            }
            return authUser;
        }

        private static void CurrentUserMap(IDataReader reader, short set, ref UserBase authUser, ref List<string> Roles, ref List<string> Challenges)
        {
            List<string> extProviders = null;
            switch (set)
            {
                case 0:
                    int startingIndex = 0;
                    authUser = new UserBase
                    {
                        Id = reader.GetSafeInt32(startingIndex++),
                        Name = reader.GetSafeString(startingIndex++),
                        PhotoUrl = reader.GetSafeString(startingIndex++)
                    };

                    break;
                case 1:
                    string role = reader.GetSafeString(0);

                    if (Roles == null)
                    {
                        Roles = new List<string>();
                    }
                    Roles.Add(role);

                    break;
                case 2:
                    string extProvider = reader.GetSafeString(0);

                    if (extProviders == null)
                    {
                        extProviders = new List<string>();
                    }

                    extProviders.Add("Has" + extProvider);
                    break;

                case 3:
                    string challenge = reader.GetSafeString(0);

                    if (Challenges == null)
                    {
                        Challenges = new List<string>();
                    }
                    Challenges.Add(challenge);

                    break;
            }

            if (authUser != null && (extProviders != null || Roles != null || Challenges != null))
            {
                authUser.ExtProviders = extProviders;
                authUser.Roles = Roles;
                authUser.Challenges = Challenges;
            }
        }

        private string GetPassword(string email)
        {
            string password = null;
            string procName = "[dbo].[Users_SelectPasswordV3]";
            _dataProvider.ExecuteCmd(procName
                   , delegate (SqlParameterCollection paramCollection)
                   {
                       paramCollection.AddWithValue("@EmailAddress", email);
                   }
                   , singleRecordMapper: delegate (IDataReader reader, short set)
                   {
                       password = reader.GetSafeString(0);
                   }
                   );

            return password;
        }

        private bool CheckConfirmation(string email)
        {
            bool isConfirmed = false;
            string procName = "[dbo].[Users_CheckConfirmation]";
            _dataProvider.ExecuteCmd(procName
                   , delegate (SqlParameterCollection paramCollection)
                   {
                       paramCollection.AddWithValue("@EmailAddress", email);
                   }
                   , singleRecordMapper: delegate (IDataReader reader, short set)
                   {
                       isConfirmed = reader.GetSafeBool(0);
                   }
                   );

            return isConfirmed;
        }

        public IUserAuthData Get(string email)
        {
            UserBase authUser = null;
            List<string> roles = null;
            List<string> challenges = null;
            string procName = "[dbo].[Users_SelectByEmail_V7]";
            _dataProvider.ExecuteCmd(procName
                   , delegate (SqlParameterCollection paramCollection)
                   {
                       paramCollection.AddWithValue("@EmailAddress", email);
                   }
                   , singleRecordMapper: delegate (IDataReader reader, short set)
                   {
                       CurrentUserMap(reader, set, ref authUser, ref roles, ref challenges);
                   }
                   );

            if (authUser != null)
            {
                Update(authUser.Id, DateTime.Now);
            }

            return authUser;
        }


        public async Task<int> Create(UserAddRequest data, UserStatus status = UserStatus.Active)
        {
            if (data == null)
            {
                throw new ArgumentNullException("Parameter data is required");
            }
            string storedProc = "[dbo].[Users_InsertV7]";

            int empId = 0;
            string password = data.Password;
            string hashedPassword = BCrypt.Net.BCrypt.HashPassword(password);
            Guid sqlToken = Guid.Empty;

            _dataProvider.ExecuteNonQuery(storedProc
                , delegate (SqlParameterCollection paramCollection)
                {
                    paramCollection.AddWithValue("@UserName", data.Username);
                    paramCollection.AddWithValue("@IsConfirmed", data.IsConfirmed = false);
                    paramCollection.AddWithValue("@EmailAddress", data.EmailAddress);
                    paramCollection.AddWithValue("@Password", hashedPassword);
                    paramCollection.AddWithValue("@StatusId", (int)status);

                    SqlParameter idParameter = new SqlParameter("@Id", System.Data.SqlDbType.Int);
                    idParameter.Direction = System.Data.ParameterDirection.Output;

                    SqlParameter token = new SqlParameter("@Token", System.Data.SqlDbType.UniqueIdentifier);
                    token.Direction = System.Data.ParameterDirection.Output;

                    paramCollection.Add(idParameter);
                    paramCollection.Add(token);
                }, returnParameters: delegate (SqlParameterCollection param)
                {
                    Int32.TryParse(param["@Id"].Value.ToString(), out empId);
                    Guid.TryParse(param["@Token"].Value.ToString(), out sqlToken);

                });

            bool isSuccessful = await _emailService.ConfirmAccount(data.EmailAddress, sqlToken);

            return empId;
        }

        ...

        
    }
}
