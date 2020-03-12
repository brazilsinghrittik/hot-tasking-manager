import { defineMessages } from 'react-intl';

/**
 * Internationalized messages for use on header.
 */
export default defineMessages({
  exploreProjects: {
    id: 'header.nav.projects',
    defaultMessage: 'Explore projects',
  },
  learn: {
    id: 'header.nav.learn',
    defaultMessage: 'Learn',
  },
  about: {
    id: 'header.nav.aboutLink',
    defaultMessage: 'About',
  },
  myContributions: {
    id: 'header.nav.my_contributions',
    defaultMessage: 'My contributions',
  },
  manage: {
    id: 'header.nav.manage',
    defaultMessage: 'Manage',
  },
  logIn: {
    id: 'header.buttons.logIn',
    defaultMessage: 'Log in',
  },
  signUp: {
    id: 'header.buttons.signUp',
    defaultMessage: 'Sign up',
  },
  authorize: {
    id: 'header.buttons.authorize',
    defaultMessage: 'Authorize',
  },
  AuthorizeTitle: {
    id: 'signUp.modal.authorize',
    defaultMessage: 'Have you finished the registration on OpenStreetMap?',
  },
  AuthorizeMessage: {
    id: 'signUp.authorize.message',
    defaultMessage:
      'To start mapping, you need to authorize Tasking Manager to access your OpenStreetMap account',
  },
  osmRegisterCheck: {
    id: 'signUp.authorize.check',
    defaultMessage: 'Still need an openstreetmap account?',
  },
  signUpTitle: {
    id: 'signUp.modal.title',
    defaultMessage: 'Sign up',
  },
  signupLabelEmail: {
    id: 'signUp.modal.form_email',
    defaultMessage: 'Email',
  },
  signupLabelName: {
    id: 'signUp.modal.form_name',
    defaultMessage: 'Name',
  },
  proceedOSMTitle: {
    id: 'signUp.proceed_osm.osm_title',
    defaultMessage: 'Do you have OpenstreetMap account?',
  },
  proceedOSMPart1: {
    id: 'signup.proceed_osm.text1',
    defaultMessage:
      'Tasking Manager works with OpenStreetMap, a collaborative, open-source map of the world.',
  },
  proceedOSMPart2: {
    id: 'signup.proceed_osm.text2',
    defaultMessage:
      'All the data mapped in Tasking Manager projects are available on OSM. So you need an OpenstreetMap account in order to collaborate in one of our projects',
  },
  emailPlaceholder: {
    id: 'input.placeholder.email_address',
    defaultMessage: 'Your email address',
  },
  invalidEmail: {
    id: 'input.errors.email_address',
    defaultMessage: 'Invalid email address',
  },
  invalidName: {
    id: 'input.errors.name',
    defaultMessage: 'Invalid name',
  },
  namePlaceHolder: {
    id: 'input.placeholder.Name',
    defaultMessage: 'Your Name',
  },
  slogan: {
    id: 'header.topBar.slogan',
    defaultMessage: 'Mapping our world together',
  },
  settings: {
    id: 'header.nav.settings',
    defaultMessage: 'Settings',
  },
  myTeams: {
    id: 'header.nav.my_teams',
    defaultMessage: 'My teams',
  },
  logout: {
    id: 'header.nav.logout',
    defaultMessage: 'Logout',
  },
  email: {
    id: 'signup.modal.email',
    defaultMessage: 'Email',
  },
  submitProceed: {
    id: 'signup.button.submit',
    defaultMessage: 'Next',
  },
  submitProceedOSM: {
    id: 'signup.button.submit_osm',
    defaultMessage: 'Proceed to OSM',
  },
  signUpQuestion: {
    id: 'signup.modal.question',
    defaultMessage: 'Please share your name and email address, so we can keep in touch',
  },
  emailUpdateButton: {
    id: 'emailUpdate.modal.button',
    defaultMessage: 'Update',
  },
  emailUpdateSuccess: {
    id: 'emailUpdate.modal.success_message',
    defaultMessage: 'Email updated successfully',
  },
  emailUpdateTitle: {
    id: 'emailUpdate.modal.title',
    defaultMessage: 'Update your email',
  },
  emailUpdateTextPart1: {
    id: 'emailUpdate.modal.text1',
    defaultMessage: 'Before you begin mapping, please add your email address.',
  },
  emailUpdateTextPart2: {
    id: 'emailUpdate.modal.text2',
    defaultMessage:
      'Providing your email address ensures that notifications about your mapping projects will reach you.',
  },
  privacyPolicy: {
    id: 'emailUpdate.modal.privacy_policy',
    defaultMessage:
      "Read our Privacy Policy for more information on how we protect users' personal data.",
  },
});
