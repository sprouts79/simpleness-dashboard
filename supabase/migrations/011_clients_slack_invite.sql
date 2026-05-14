-- Add slack_invite_url to clients for customer-onboarding into Slack channel

alter table public.clients
  add column if not exists slack_invite_url text;

comment on column public.clients.slack_invite_url is
  'Delelig Slack-invite-lenke for kundens dedikerte kanal — vises på onboarding-velkomst.';
