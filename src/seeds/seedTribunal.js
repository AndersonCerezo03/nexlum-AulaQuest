const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGODB_URI)
  .then(() => { console.log('✅ MongoDB conectado'); seed(); })
  .catch(err => { console.error('❌', err.message); process.exit(1); });

const TribunalCase    = require('../models/TribunalCase');
const TribunalMandate = require('../models/TribunalMandate');

// 6 casos "whimsical", no controversiales, estilo legal, nivel C2.
const CASES = [
  { title: 'The Case of the Migrating Stapler', difficulty: 2,
    briefText: 'The communal stapler has vanished from the third-floor supply nook. A colleague was seen carrying a suspiciously stapler-shaped object wrapped in a napkin. You must argue their complete innocence before the Court of Small Grievances.',
    suggestedDevices: ['hedging','litotes','euphemism'],
    mandate: { requiredDevices: ['hedging','litotes'], registerTarget: 'formal', requiresBluff: true,
      bluffInstruction: 'Confidently assert a fabricated but plausible fact (e.g., that the stapler was officially decommissioned last Tuesday) as though it were established record.' } },

  { title: 'The Great Coffee Machine Partiality', difficulty: 3,
    briefText: 'The office coffee machine is accused of dispensing richer brews to the Marketing department than to Accounting. As advocate for the machine, defend its impeccable neutrality.',
    suggestedDevices: ['euphemism','rhetorical_question','hedging'],
    mandate: { requiredDevices: ['euphemism','rhetorical_question'], registerTarget: 'diplomatic', requiresBluff: false,
      bluffInstruction: '' } },

  { title: 'The Trial of the Overwatered Fern', difficulty: 2,
    briefText: 'The office fern, "Sir Reginald", has perished. The accused claims it was loved too much rather than neglected. Argue that excessive affection, not malice, ended Sir Reginald.',
    suggestedDevices: ['irony','hyperbole','nominalization'],
    mandate: { requiredDevices: ['irony','hyperbole'], registerTarget: 'academic', requiresBluff: false,
      bluffInstruction: '' } },

  { title: 'The Matter of the Rescheduled Assembly', difficulty: 4,
    briefText: 'A weekly assembly was quietly moved forward by an hour, stranding half the guild. You represent the anonymous rescheduler and must justify the change as a triumph of foresight.',
    suggestedDevices: ['nominalization','hedging','euphemism'],
    mandate: { requiredDevices: ['nominalization','hedging'], registerTarget: 'academic', requiresBluff: true,
      bluffInstruction: 'State with authority a false procedural detail — that all members were notified via an official channel that, in truth, does not exist.' } },

  { title: 'The Affair of the Unsigned Cake', difficulty: 3,
    briefText: 'An unsigned birthday cake appeared in the break room, causing mild chaos over whose birthday it honoured. Defend your client, who is suspected of the anonymous gesture.',
    suggestedDevices: ['litotes','euphemism','irony'],
    mandate: { requiredDevices: ['litotes','euphemism'], registerTarget: 'formal', requiresBluff: false,
      bluffInstruction: '' } },

  { title: 'The Curious Incident of the Squeaky Chair', difficulty: 3,
    briefText: 'A single squeaky chair has allegedly ruined the sacred silence of the Reading Guild for a fortnight. You must argue that the chair is, in fact, a cherished cultural artifact worth preserving.',
    suggestedDevices: ['rhetorical_question','hyperbole','hedging'],
    mandate: { requiredDevices: ['rhetorical_question','hyperbole','hedging'], registerTarget: 'diplomatic', requiresBluff: true,
      bluffInstruction: 'Assert with total confidence a made-up provenance — that the chair was crafted by a renowned (fictional) guild artisan a century ago.' } },
];

async function seed() {
  await TribunalCase.deleteMany({ createdBy: 'seed' });
  await TribunalMandate.deleteMany({});
  let n = 0;
  for (const c of CASES) {
    const doc = await TribunalCase.create({ title: c.title, briefText: c.briefText, difficulty: c.difficulty, suggestedDevices: c.suggestedDevices, createdBy: 'seed', language: 'en' });
    await TribunalMandate.create(Object.assign({ caseId: doc._id }, c.mandate));
    n++;
  }
  console.log(`✅ El Tribunal: ${n} casos + ${n} mandatos precargados`);
  mongoose.disconnect();
}
