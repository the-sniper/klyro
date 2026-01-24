
const CALENDLY_API_BASE = 'https://api.calendly.com';

export interface CalendlyUser {
  resource: {
    uri: string;
    name: string;
    slug: string;
    email: string;
    scheduling_url: string;
    timezone: string;
    avatar_url: string | null;
  };
}

export interface CalendlyEventType {
  uri: string;
  name: string;
  active: boolean;
  slug: string;
  scheduling_url: string;
  description_plain: string | null;
  duration: number;
}

export async function getCalendlyUser(token: string): Promise<CalendlyUser | null> {
  try {
    const res = await fetch(`${CALENDLY_API_BASE}/users/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!res.ok) {
        console.error('Calendly User Fetch Error:', await res.text());
        return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Calendly User Fetch Failed:', error);
    return null;
  }
}

export async function getEventTypes(token: string, userUri: string): Promise<CalendlyEventType[]> {
  try {
    const res = await fetch(`${CALENDLY_API_BASE}/event_types?user=${encodeURIComponent(userUri)}&active=true`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
        console.error('Calendly Event Types Fetch Error:', await res.text());
        return [];
    }
    
    const data = await res.json();
    return data.collection.map((item: any) => ({
        uri: item.uri,
        name: item.name,
        active: item.active,
        slug: item.slug,
        scheduling_url: item.scheduling_url,
        description_plain: item.description_plain,
        duration: item.duration,
    }));
  } catch (error) {
    console.error('Calendly Event Types Fetch Failed:', error);
    return [];
  }
}
export async function getAvailableSlots(token: string, eventTypeUri: string, startTime: string, endTime: string): Promise<any[]> {
  try {
    const res = await fetch(`${CALENDLY_API_BASE}/event_type_available_times?event_type=${encodeURIComponent(eventTypeUri)}&start_time=${startTime}&end_time=${endTime}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
        console.error('Calendly Available Times Fetch Error:', await res.text());
        return [];
    }
    
    const data = await res.json();
    return data.collection || [];
  } catch (error) {
    console.error('Calendly Available Times Fetch Failed:', error);
    return [];
  }
}
