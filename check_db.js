const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://zahidqureshi5104:zahid5104@cluster0.bzgbadc.mongodb.net/spaceageTest?appName=Cluster0';

const TeamMemberSchema = new mongoose.Schema({}, { strict: false });
const TeamMember = mongoose.models.TeamMember || mongoose.model('TeamMember', TeamMemberSchema, 'teammembers');

const TimelineEventSchema = new mongoose.Schema({}, { strict: false });
const TimelineEvent = mongoose.models.TimelineEvent || mongoose.model('TimelineEvent', TimelineEventSchema, 'timelineevents');

const SiteSettingsSchema = new mongoose.Schema({}, { strict: false });
const SiteSettings = mongoose.models.SiteSettings || mongoose.model('SiteSettings', SiteSettingsSchema, 'sitesettings');

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to DB');

    const teamCount = await TeamMember.countDocuments();
    const timelineCount = await TimelineEvent.countDocuments();
    const settingsCount = await SiteSettings.countDocuments();

    console.log(`Team members count: ${teamCount}`);
    console.log(`Timeline events count: ${timelineCount}`);
    console.log(`Site settings count: ${settingsCount}`);

    if (teamCount > 0) {
      const members = await TeamMember.find().limit(5);
      console.log('Sample Team Members:', JSON.stringify(members, null, 2));
    }
    if (timelineCount > 0) {
      const events = await TimelineEvent.find().limit(5);
      console.log('Sample Timeline Events:', JSON.stringify(events, null, 2));
    }
    if (settingsCount > 0) {
      const settings = await SiteSettings.findOne();
      console.log('Site Settings:', JSON.stringify(settings, null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
