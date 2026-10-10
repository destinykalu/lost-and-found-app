export interface Campus {
  id: string;
  name: string;
  state: string;
}

export interface Item {
  id: string;
  campus_id: string;
  type: 'found' | 'lost';
  title?: string;
  description?: string;
  image_url?: string;
  image_data?: string;
  location: string;
  date_recorded: string;
  time_recorded?: string;
  status: 'active' | 'in_verification' | 'meetup_scheduled' | 'resolved' | 'unverified';
  user_name: string;
  created_at: string;
}
