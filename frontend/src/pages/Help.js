import React, { useState } from 'react';

function Help() {
  const [activeSection, setActiveSection] = useState('getting-started');

  const faqData = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          q: 'How do I create an account?',
          a: 'Click on "Sign Up" from the login page, fill in your details (username, email, phone, password), and you\'re ready to go!'
        },
        {
          q: 'How do I create an event?',
          a: 'Go to the Events page, click "Create Event", enter event name and description. Share the generated event code with your friends to join.'
        },
        {
          q: 'How do I join an event?',
          a: 'Click "Join Event" on the Events page, enter the event code shared by the event creator, and you\'ll be added to the event.'
        }
      ]
    },
    {
      id: 'expenses',
      title: 'Managing Expenses',
      icon: '💰',
      questions: [
        {
          q: 'How do I add an expense?',
          a: 'In an event, click "Add Expense", enter the total amount, select participants to split with, add a description, and submit.'
        },
        {
          q: 'How does expense splitting work?',
          a: 'The total amount is automatically divided equally among selected participants. Each person gets their share of the expense.'
        },
        {
          q: 'How do I mark an expense as paid?',
          a: 'Go to History page, find the expense, and click the "Settle" button to mark it as paid.'
        },
        {
          q: 'How do I send a reminder?',
          a: 'In the History page, click the "Remind" button next to any pending expense to send an in-app notification to the person who owes money.'
        }
      ]
    },
    {
      id: 'settlements',
      title: 'Settlements & Debts',
      icon: '⚖️',
      questions: [
        {
          q: 'How does the settlement feature work?',
          a: 'Click "Settle Up" in an event to see the minimum number of transactions needed to clear all debts between participants.'
        },
        {
          q: 'What does the settlement plan show?',
          a: 'It shows who should pay whom and how much, optimized to minimize the number of transactions needed.'
        },
        {
          q: 'How do I conclude an event?',
          a: 'Only the event creator can conclude an event. Click "Conclude Event" to mark it as closed and prevent further expense additions.'
        }
      ]
    },
    {
      id: 'profile',
      title: 'Profile & Account',
      icon: '🙍‍♂️',
      questions: [
        {
          q: 'How do I update or edit my profile?',
          a: (
            <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
              <li><b>Go to Profile:</b> Click your profile or avatar in the top right, then select <b>My Profile</b>.</li>
              <li><b>View & Edit:</b> Edit your username, email, phone, and profile picture directly in the form fields shown.</li>
              <li><b>Change Picture:</b> Click your current profile photo and select a new JPG or PNG image. Preview will update instantly.</li>
              <li><b>Save Changes:</b> Click <b>Save</b> or <b>Update Profile</b> at the bottom. Wait for the success message.</li>
              <li><b>Done:</b> Your updated info and image will reflect everywhere in the app immediately after saving.</li>
              <li><b>Notes:</b>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  <li>Large images will be compressed automatically – if upload fails, choose a smaller file.</li>
                  <li>If any field is invalid or taken, you’ll see a helpful error.</li>
                </ul>
              </li>
            </ol>
          )
        }
      ]
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      icon: '🔧',
      questions: [
        {
          q: 'I can\'t log in to my account',
          a: 'Check your username and password. If you\'ve forgotten your password, contact support for assistance.'
        },
        {
          q: 'I can\'t join an event with the code',
          a: 'Make sure the event code is correct and the event hasn\'t been concluded. Event codes are case-sensitive.'
        },
        {
          q: 'My expenses are not showing up',
          a: 'Refresh the page or check if you\'re in the correct event. Expenses are linked to specific events.'
        },
        {
          q: 'I can\'t see the "Conclude Event" button',
          a: 'Only the event creator can see this button. Make sure you\'re logged in as the person who created the event.'
        }
      ]
    }
  ];

  const contactInfo = {
    phone: '+91 8200354703',
    email: 'maharshibhattisro@gmail.com',
    hours: 'Mon-Fri: 9:00 AM - 6:00 PM IST'
  };

  return (
    <div className="help-page">
      <style>{`
        .help-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 2rem 0;
        }
        
        .help-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1rem;
        }
        
        .help-header {
          text-align: center;
          color: white;
          margin-bottom: 3rem;
        }
        
        .help-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 1rem;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .help-header p {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .help-content {
          display: grid;
          grid-template-columns: 1fr 2fr;
          gap: 2rem;
          margin-bottom: 3rem;
        }
        
        .help-sidebar {
          background: rgba(255,255,255,0.95);
          border-radius: 15px;
          padding: 2rem;
          height: fit-content;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .help-main {
          background: rgba(255,255,255,0.95);
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .section-nav {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .section-nav li {
          margin-bottom: 0.5rem;
        }
        
        .section-nav button {
          width: 100%;
          padding: 1rem;
          border: none;
          background: transparent;
          border-radius: 10px;
          text-align: left;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .section-nav button:hover {
          background: rgba(102, 126, 234, 0.1);
          transform: translateX(5px);
        }
        
        .section-nav button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .section-title h2 {
          font-size: 2rem;
          color: #333;
          margin: 0;
        }
        
        .faq-item {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 10px;
          border-left: 4px solid #667eea;
        }
        
        .faq-question {
          font-weight: 600;
          color: #333;
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }
        
        .faq-answer {
          color: #666;
          line-height: 1.6;
        }
        
        .contact-section {
          background: rgba(255,255,255,0.95);
          border-radius: 15px;
          padding: 2rem;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        
        .contact-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 2rem;
          margin-top: 2rem;
        }
        
        .contact-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          border-radius: 15px;
          text-align: center;
          transition: transform 0.3s ease;
        }
        
        .contact-card:hover {
          transform: translateY(-5px);
        }
        
        .contact-card .icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }
        
        .contact-card h3 {
          margin-bottom: 0.5rem;
          font-size: 1.3rem;
        }
        
        .contact-card p {
          margin: 0;
          opacity: 0.9;
        }
        
        .contact-card a {
          color: white;
          text-decoration: none;
          font-weight: 600;
        }
        
        .contact-card a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .help-content {
            grid-template-columns: 1fr;
          }
          
          .help-header h1 {
            font-size: 2rem;
          }
          
          .contact-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="help-container">
        {/* Header */}
        <div className="help-header">
          <h1>Help & Support</h1>
          <p>Find answers to common questions and get the help you need to make the most of MilBantKar</p>
        </div>

        {/* Main Content */}
        <div className="help-content">
          {/* Sidebar Navigation */}
          <div className="help-sidebar">
            <h3 style={{ marginBottom: '1.5rem', color: '#333' }}>Quick Navigation</h3>
            <ul className="section-nav">
              {faqData.map((section) => (
                <li key={section.id}>
                  <button
                    className={activeSection === section.id ? 'active' : ''}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <span>{section.icon}</span>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Main Content Area */}
          <div className="help-main">
            {faqData.map((section) => (
              activeSection === section.id && (
                <div key={section.id}>
                  <div className="section-title">
                    <span style={{ fontSize: '2rem' }}>{section.icon}</span>
                    <h2>{section.title}</h2>
                  </div>
                  
                  {section.questions.map((faq, index) => (
                    <div key={index} className="faq-item">
                      <div className="faq-question">Q: {faq.q}</div>
                      <div className="faq-answer">A: {faq.a}</div>
                    </div>
                  ))}
                </div>
              )
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="contact-section">
          <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
            Still Need Help? Contact Us
          </h2>
          <p style={{ textAlign: 'center', color: '#666', marginBottom: '2rem' }}>
            Our support team is here to help you with any questions or issues
          </p>
          
          <div className="contact-grid">
            <div className="contact-card">
              <div className="icon">📞</div>
              <h3>Call Us</h3>
              <p>
                <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
              </p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {contactInfo.hours}
              </p>
            </div>
            
            <div className="contact-card">
              <div className="icon">✉️</div>
              <h3>Email Support</h3>
              <p>
                <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
              </p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                We'll respond within 24 hours
              </p>
            </div>
            
            <div className="contact-card">
              <div className="icon">💬</div>
              <h3>Quick Tips</h3>
              <p>Check the FAQ section above for instant answers to common questions</p>
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Most issues can be resolved quickly
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Help;
