import { supabase } from './supabase';

export async function trackEvent(
  eventType: string,
  eventData?: any,
  pageUrl?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const event = {
      user_id: user?.id,
      event_type: eventType,
      event_data: eventData,
      page_url: pageUrl || window.location.pathname,
      referrer: document.referrer,
      user_agent: navigator.userAgent
    };

    await supabase.from('analytics_events').insert(event);
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

export async function startSession() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const sessionId = crypto.randomUUID();
    
    const deviceType = /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop';
    const browser = /Chrome|Firefox|Safari|Edge|Opera/i.exec(navigator.userAgent)?.[0] || 'other';
    
    await supabase.from('analytics_sessions').insert({
      user_id: user?.id,
      session_id: sessionId,
      device_type: deviceType,
      browser,
      traffic_source: document.referrer ? new URL(document.referrer).hostname : 'direct'
    });

    return sessionId;
  } catch (error) {
    console.error('Error starting session:', error);
    return null;
  }
}

export async function endSession(sessionId: string) {
  try {
    await supabase
      .from('analytics_sessions')
      .update({
        end_time: new Date().toISOString()
      })
      .eq('session_id', sessionId);
  } catch (error) {
    console.error('Error ending session:', error);
  }
}

export async function trackPageView(url: string) {
  await trackEvent('page_view', { url });
}

let sessionId: string | null = null;

export async function initAnalytics() {
  sessionId = await startSession();
  
  const handlePageView = () => {
    trackPageView(window.location.pathname);
  };

  const handleUnload = () => {
    if (sessionId) {
      endSession(sessionId);
    }
  };

  window.addEventListener('popstate', handlePageView);
  window.addEventListener('beforeunload', handleUnload);

  handlePageView();

  return async () => {
    window.removeEventListener('popstate', handlePageView);
    window.removeEventListener('beforeunload', handleUnload);
    if (sessionId) {
      await endSession(sessionId);
    }
  };
}