
ALTER proc [dbo].[Users_UpdateV3]
		@Id int,
		@UserName nvarchar(50),
		@EmailAddress nvarchar(50),
		@StatusId int,
		@IsConfirmed bit,
		@ModifiedBy int
as
/*
	Declare
		@_Id int = 7,
		@_UserName nvarchar(50) = 'omgdogsOMG',
		@_EmailAddress nvarchar(50) = 'omgdogsOMG@gmail.com'

	Execute [dbo].[Users_UpdateV2]
		@_Id,
		@_UserName,
		@_EmailAddress

	Select *
		From [dbo].[Users]
		Where [Id] = @_Id
*/

BEGIN

	DECLARE 
		@DateModified datetime2(7) = getutcdate()
	
	IF NOT EXISTS (Select 1
					FROM [dbo].[Users]
					WHERE [EmailAddress] = @EmailAddress					
					AND [Id] != @Id)

		UPDATE
			[dbo].[Users]
		SET
			[UserName] = @UserName,
			[EmailAddress] = @EmailAddress,
			[DateModified] = @DateModified,
			[StatusId] = @StatusId,
			[IsConfirmed] = @IsConfirmed,
			[ModifiedBy] = @ModifiedBy
		WHERE
			[Id] = @Id
		

END