Definitions:
- Monitoring app --> the app we at WARP can sign into and manage the tenants etc
- Reporting app --> the app a tenant can sign into and manage the questionnaires, branding etc
- Ui app --> the app that shows the questionnaires

Must haves:

- In the monitoring app we need to be able to create a new tenant with the `owner` role and send an invite link to the emailadress of that tenant. Tenant can click on link in email and accept the invitation and set a password. Tenant and email will be prefilled.

- Make sure that a tenant can invite/add users and set permissions in the reporting app. There should only be 1 `owner`, but there can be multiple `admin`s

- Add a configuration screen in the monitoring app so we can set up an SMTP server

- Add a configuration screen in the monitoring app so we can setup a payment provider like Stripe

- Add a storage bucket where images are uploaded to and refactor the api to upload to said storage bucket instead of storing the images locally

- Test if CORS is set correctly in the reporting and monitoring apps.

- Add rate limiting to certain routes in the reporting app.

- Add password retry feature to the reporting and monitoring apps where if a user fills in the incorrect password more than 3 times, they'll get locked out (temporarily)

- Add password reset feature to the reporting and monitoring apps.

- Check if we want to continue using TinyMCE or another WYSIWYG editor for the email template in the reporting app

- A tenant should be able to create a custom PDF template in the reporting app. We'll need to check how far and how customizable this should be

- What do we do with the answers the respondent filled in for without leaving his email adress? How do we want to display this? etc.

- In the Reporting app, a tenant should be able to create their own custom PDF template with images, placeholders etc.

- In the Reporting app, a tenant should be able to add a custom all to action in a questionnaire. Could be something like: "Need help? Call us now" (with phone number)


Nice to haves:
- Refactor the ui, reporting and monitoring apps to use atomic design. This will improve the readability of the apps

- In the Reporting app, allow a tenant to upload their custom font