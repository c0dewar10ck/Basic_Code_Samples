ALTER proc [dbo].[Users_InsertV7]
		@Id int OUT,
		@UserName nvarchar(50),
		@IsConfirmed bit,
		@EmailAddress nvarchar(50),
		@Password nvarchar(100),
		@StatusId int,
		@Token uniqueidentifier OUTPUT
		
as
/*
	Declare
		@_Id int,
		@_UserName nvarchar(50) = 'timloo',
		@_IsConfirmed bit = 1,
		@_EmailAddress nvarchar(50) = 'tloo@dispostable.com',
		@_Password nvarchar(100) = 'passworD!1',
		@_StatusId int = 1,
		@_Token uniqueidentifier
		

	Execute [dbo].[Users_InsertV7]
		@_Id OUT,
		@_UserName,
		@_IsConfirmed,
		@_EmailAddress,
		@_Password,
		@_StatusId,
		@_Token OUT
		

	Select *
		From [dbo].[Users]
		Where [Id] = @_Id
	select * from Pets where [UserId] = @_Id
	select * from UserRoles where [UserId] = @_Id
	select * from Points where [UserId] = @_Id

*/

BEGIN

	IF NOT EXISTS (Select 1
					FROM [dbo].[Users]
					WHERE [EmailAddress] = @EmailAddress)

	BEGIN

		INSERT INTO 
				[dbo].[Users] (
					[UserName],
					[IsConfirmed],
					[EmailAddress],
					[Password],
					[StatusId]
			   ) VALUES (
					@UserName,
					@IsConfirmed,
					@EmailAddress,
					@Password,
					@StatusId
				)

		SET @Id = SCOPE_IDENTITY()

		Declare 
			@TokenType smallint = 1
			,@UserId int
			,@_id int

		SET @UserId = @Id
		SET @Token = NEWID()

		Execute dbo.Insert_Token_v2
					@Token
					,@UserId
					,@TokenType


		Execute [dbo].[Pets_InsertDummyDog]
					@_id,
					@UserId,
					@Username



		Declare 
				
				@RoleId int

				Execute [dbo].[UserRoles_InsertV2]
				@UserId

	IF EXISTS (Select 1
			   FROM [dbo].[UserInvites]
			   WHERE [EmailAddress] = @EmailAddress)

		BEGIN

			DECLARE
				@Points int = (Select [Points] From [dbo].[UserInvites] Where [EmailAddress] = @EmailAddress)

			EXEC [dbo].[Points_InsertV2]
				@UserId,
				@Points

		END	

	ELSE 
		
		BEGIN

			EXEC [dbo].[Points_InsertV2]
				@UserId,
				0

		END
		
	END


END