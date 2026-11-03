// All values are SAMPLE data. Real policies/rates/rules: "Needs stakeholder confirmation".
export const PERMS = [
  ['dashboard.view', 'View dashboard'],
  ['reports.view', 'View reports'],
  ['reports.payroll', 'View payroll reports'],
  ['reports.export', 'Export reports (PDF / Excel)'],
  ['notifications.announce', 'Post HR announcements'],
  ['recruitment.view', 'View recruitment & onboarding'],
  ['recruitment.manage', 'Manage recruitment & onboarding'],
  ['roles.manage', 'Manage roles & users'],
]
export const ROLES = {
  Admin: PERMS.map(p => p[0]),
  'HR Manager': ['dashboard.view','reports.view','reports.payroll','reports.export','notifications.announce','recruitment.view','recruitment.manage'],
  'HR Officer': ['dashboard.view','reports.view','reports.export','notifications.announce','recruitment.view','recruitment.manage'],
  Manager: ['dashboard.view','reports.view','recruitment.view'],
  Employee: ['dashboard.view'],
}
export const USERS = [
  { id: 1, name: 'Nimali Perera', email: 'admin@hr.test', password: 'Admin@123', role: 'Admin' },
  { id: 2, name: 'Kasun Fernando', email: 'manager.hr@hr.test', password: 'Pass@1234', role: 'HR Manager' },
  { id: 3, name: 'Tharushi Silva', email: 'officer@hr.test', password: 'Pass@1234', role: 'HR Officer' },
  { id: 4, name: 'Dinesh Jayasuriya', email: 'lead@hr.test', password: 'Pass@1234', role: 'Manager' },
  { id: 5, name: 'Sanduni Wickrama', email: 'staff@hr.test', password: 'Pass@1234', role: 'Employee' },
]
export const DEPTS = [
  { name: 'Engineering', employees: 72, present: 63, late: 5, absent: 4, hours: 8.4, gross: 9800000, ded: 1450000 },
  { name: 'Finance', employees: 28, present: 26, late: 1, absent: 1, hours: 8.1, gross: 4100000, ded: 640000 },
  { name: 'Human Resources', employees: 16, present: 15, late: 0, absent: 1, hours: 8.0, gross: 2100000, ded: 310000 },
  { name: 'Operations', employees: 84, present: 70, late: 8, absent: 6, hours: 8.6, gross: 7300000, ded: 1100000 },
  { name: 'Sales', employees: 48, present: 40, late: 4, absent: 4, hours: 8.2, gross: 5600000, ded: 820000 },
]
export const WEEK = [['Mon', 92], ['Tue', 90], ['Wed', 94], ['Thu', 88], ['Fri', 85]]
export const PENDING_LEAVE = [
  { id: 1, name: 'Ishara Gunawardena', dept: 'Engineering', type: 'Annual', from: '2026-11-03', to: '2026-11-05' },
  { id: 2, name: 'Mahesh Rajapaksa', dept: 'Sales', type: 'Medical', from: '2026-10-30', to: '2026-10-30' },
  { id: 3, name: 'Chamari Dias', dept: 'Finance', type: 'Casual', from: '2026-11-09', to: '2026-11-09' },
]
export const NOTIFS = [
  { id: 1, type: 'leave', title: 'Leave request from Ishara Gunawardena', body: 'Annual leave, 3–5 Nov. Waiting for your decision.', at: '2026-10-29 09:12', read: false },
  { id: 2, type: 'attendance', title: 'Late arrivals above usual', body: 'Operations had 8 late check-ins today.', at: '2026-10-29 09:40', read: false },
  { id: 3, type: 'announcement', title: 'Staff meeting moved to Friday', body: 'The monthly all-hands is now on 30 Oct, 3:00 PM.', at: '2026-10-28 16:05', read: true },
  { id: 4, type: 'leave', title: 'Your medical leave was approved', body: 'Approved by Kasun Fernando for 21 Oct.', at: '2026-10-20 11:30', read: true },
]
export const VACANCIES = [
  { id: 1, title: 'Senior Frontend Engineer', dept: 'Engineering', openings: 2, closes: '2026-11-20', status: 'Open' },
  { id: 2, title: 'Payroll Executive', dept: 'Finance', openings: 1, closes: '2026-11-12', status: 'Open' },
  { id: 3, title: 'Sales Associate', dept: 'Sales', openings: 4, closes: '2026-10-25', status: 'Closed' },
]
export const STAGES = ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected']
export const APPLICANTS = [
  { id: 1, name: 'Amaya Senanayake', vac: 1, stage: 'Applied', email: 'amaya@mail.test' },
  { id: 2, name: 'Rohan Abeysekera', vac: 1, stage: 'Shortlisted', email: 'rohan@mail.test' },
  { id: 3, name: 'Piumi Karunaratne', vac: 2, stage: 'Interview', email: 'piumi@mail.test' },
  { id: 4, name: 'Tharindu Bandara', vac: 1, stage: 'Selected', email: 'tharindu@mail.test' },
  { id: 5, name: 'Lakshani Herath', vac: 3, stage: 'Selected', email: 'lakshani@mail.test' },
  { id: 6, name: 'Janith Peiris', vac: 2, stage: 'Rejected', email: 'janith@mail.test' },
]
export const INTERVIEWS = [
  { id: 1, applicant: 3, date: '2026-11-02', time: '10:00', mode: 'Online', panel: 'Kasun F., Chamari D.' },
]
export const ONBOARD_DOCS = ['NIC copy', 'Bank details', 'Signed offer letter', 'Education certificates', 'Medical report']
export const PROBATION = [
  { id: 1, name: 'Sachini Amarasinghe', dept: 'Engineering', start: '2026-07-01', months: 6, status: 'On probation' },
  { id: 2, name: 'Buddhika Liyanage', dept: 'Sales', start: '2026-09-15', months: 3, status: 'On probation' },
  { id: 3, name: 'Hiruni Alwis', dept: 'Finance', start: '2026-04-01', months: 6, status: 'Confirmed' },
]
