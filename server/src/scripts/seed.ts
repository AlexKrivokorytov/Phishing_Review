import { DatabaseFactory } from '../db';
import { RecordRepository } from '../repositories/RecordRepository';
import { TagRepository } from '../repositories/TagRepository';
import type { Record } from '../types/record.types';

const db = DatabaseFactory.getConnection();

type SeedRow = Pick<Record, 'url_or_email' | 'source' | 'date_collected'> & {
  label: Record['label'];
  status: Record['status'];
  notes: string;
  tagNames: string[];
};

const SEED_RECORDS: SeedRow[] = [
  { url_or_email: 'https://paypal-secure-verify.com/login',         source: 'email_spam', date_collected: '2026-05-01', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'brand_impersonation', 'credential_form'] },
  { url_or_email: 'support@security-alert-chase.bank-update.com',   source: 'phish_tank', date_collected: '2026-05-01', label: 'phishing',   status: 'reviewed',            notes: 'Spoofs Chase Bank.',    tagNames: ['brand_impersonation', 'credential_form'] },
  { url_or_email: 'http://appleid-verify-account.info/signin',       source: 'sms_phish', date_collected: '2026-05-02', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'brand_impersonation'] },
  { url_or_email: 'update@netflix-billing-alert.net',               source: 'email_spam', date_collected: '2026-05-02', label: 'suspicious', status: 'needs_second_review', notes: 'Unusual sender domain.',tagNames: ['suspicious_domain'] },
  { url_or_email: 'https://microsoft-office365-reactivate.info/auth',source: 'phish_tank', date_collected: '2026-05-03', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'brand_impersonation', 'credential_form'] },
  { url_or_email: 'billing@amazon-support-desk.co.uk',              source: 'email_spam', date_collected: '2026-05-03', label: 'suspicious', status: 'needs_second_review', notes: 'Unusual TLD for Amazon.',tagNames: ['brand_impersonation'] },
  { url_or_email: 'https://secure-banking-chase-update.tk/portal',   source: 'honeypot',  date_collected: '2026-05-04', label: 'phishing',   status: 'reviewed',            notes: '.tk domain is free and often abused.', tagNames: ['suspicious_domain', 'credential_form'] },
  { url_or_email: 'account-alert@paypal-security.servehttp.com',     source: 'phish_tank', date_collected: '2026-05-04', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['brand_impersonation', 'url_shortener'] },
  { url_or_email: 'http://fb-login-verify.com/checkpoint',           source: 'sms_phish', date_collected: '2026-05-05', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'credential_form'] },
  { url_or_email: 'verify@google-account-recovery.support',         source: 'email_spam', date_collected: '2026-05-05', label: 'suspicious', status: 'needs_second_review', notes: '',                      tagNames: ['brand_impersonation'] },
  { url_or_email: 'https://dropbox-storage-upgrade.info/confirm',    source: 'phish_tank', date_collected: '2026-05-06', label: 'suspicious', status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'credential_form'] },
  { url_or_email: 'refund@irs-tax-refund-gov.com',                  source: 'email_spam', date_collected: '2026-05-06', label: 'phishing',   status: 'reviewed',            notes: 'Spoofs US IRS.',        tagNames: ['brand_impersonation', 'credential_form'] },
  { url_or_email: 'https://www.google.com',                         source: 'manual',     date_collected: '2026-05-07', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'https://github.com/login',                       source: 'manual',     date_collected: '2026-05-07', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'https://stackoverflow.com',                      source: 'manual',     date_collected: '2026-05-08', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'https://developer.mozilla.org',                  source: 'manual',     date_collected: '2026-05-08', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'https://www.wikipedia.org',                      source: 'manual',     date_collected: '2026-05-09', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'https://www.npmjs.com',                          source: 'manual',     date_collected: '2026-05-09', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'http://win-prize-now.xyz/claim?ref=abc123',       source: 'honeypot',  date_collected: '2026-05-10', label: 'suspicious', status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain'] },
  { url_or_email: 'http://free-iphone-giveaway.top/form',           source: 'sms_phish', date_collected: '2026-05-10', label: 'suspicious', status: 'needs_second_review', notes: '',                      tagNames: ['suspicious_domain'] },
  { url_or_email: 'https://dl-malware-dropper.ru/update.exe',        source: 'honeypot',  date_collected: '2026-05-11', label: 'malware',    status: 'reviewed',            notes: 'Binary download from .ru domain.', tagNames: ['suspicious_domain', 'suspicious_attachment_reference'] },
  { url_or_email: 'http://exploit-kit-landing.biz/gate.php',         source: 'honeypot',  date_collected: '2026-05-11', label: 'malware',    status: 'reviewed',            notes: 'Exploit kit landing page pattern.', tagNames: ['suspicious_domain'] },
  { url_or_email: 'not_an_email_or_url',                            source: 'manual',     date_collected: '2026-05-12', label: null,         status: 'new',                 notes: 'Invalid URL or Email',  tagNames: [] },
  { url_or_email: 'invalid-record-example',                         source: 'honeypot',  date_collected: '2026-05-12', label: null,         status: 'new',                 notes: 'Invalid URL or Email',  tagNames: [] },
  { url_or_email: 'https://ebank-wellsfargo-update.info/login.php',  source: 'phish_tank', date_collected: '2026-05-13', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'brand_impersonation', 'credential_form'] },
  { url_or_email: 'admin@secure-dhl-delivery-notice.com',           source: 'email_spam', date_collected: '2026-05-13', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['brand_impersonation', 'suspicious_attachment_reference'] },
  { url_or_email: 'http://crypto-wallet-restore.com/seed',          source: 'sms_phish', date_collected: '2026-05-14', label: 'phishing',   status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'credential_form'] },
  { url_or_email: 'noreply@steam-trade-offer-bot.ru',               source: 'phish_tank', date_collected: '2026-05-14', label: 'malware',    status: 'reviewed',            notes: '',                      tagNames: ['suspicious_domain', 'brand_impersonation'] },
  { url_or_email: 'https://www.cloudflare.com',                     source: 'manual',     date_collected: '2026-05-15', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
  { url_or_email: 'https://portal.azure.com',                       source: 'manual',     date_collected: '2026-05-15', label: 'benign',     status: 'reviewed',            notes: '',                      tagNames: [] },
];

function run() {
  console.log('Seeding fake data...');
  const recordRepo = new RecordRepository(db);
  const tagRepo = new TagRepository(db);
  const allTags = tagRepo.findAll();
  const tagByName = new Map(allTags.map((t) => [t.name, t.id]));

  db.prepare('DELETE FROM records').run();
  console.log('cleared existing records');

  let inserted = 0;
  for (const row of SEED_RECORDS) {
    const now = new Date().toISOString();
    const record: Record = {
      id: crypto.randomUUID(),
      url_or_email: row.url_or_email,
      source: row.source,
      date_collected: row.date_collected,
      imported_at: now,
      label: row.label,
      status: row.status,
      notes: row.notes,
      reviewed_at: row.status !== 'new' ? now : null,
    };

    const changes = recordRepo.insert(record);
    if (changes > 0) {
      inserted++;
      const tagIds = row.tagNames
        .map((name) => tagByName.get(name))
        .filter((id): id is number => id !== undefined);
      if (tagIds.length > 0) {
        tagRepo.setTagsForRecord(record.id, tagIds);
      }
    }
  }

  console.log(`seeded ${inserted} records`);
}

run();
