export interface DisclosureTemplate {
  id: string;
  user_id: string;
  source_name: string;
  template_name: string | null;
  disclosure_text: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDisclosureTemplateInput {
  source_name: string;
  template_name?: string;
  disclosure_text: string;
}

export interface UpdateDisclosureTemplateInput {
  template_name?: string;
  disclosure_text?: string;
}

export interface SourceOption {
  value: string;
  label: string;
}
