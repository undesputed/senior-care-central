-- Comprehensive services seed data
insert into public.services (slug, name, description, category) values
  -- Personal Care
  ('personal-hygiene', 'Personal Hygiene', 'Assistance with bathing, grooming, and maintaining personal cleanliness', 'Personal Care'),
  ('toileting-incontinence-care', 'Toileting & Incontinence Care', 'Help with bathroom needs and incontinence management', 'Personal Care'),
  ('dressing', 'Dressing', 'Assistance with getting dressed and undressed', 'Personal Care'),
  ('feeding', 'Feeding', 'Help with eating and drinking', 'Personal Care'),
  ('grooming', 'Grooming', 'Hair care, nail care, and personal appearance assistance', 'Personal Care'),
  
  -- Household Services
  ('meal-preparation', 'Meal Preparation', 'Planning and cooking nutritious meals', 'Household Services'),
  ('housekeeping', 'Housekeeping', 'Light housekeeping and home maintenance', 'Household Services'),
  ('laundry', 'Laundry', 'Washing, drying, and folding clothes and linens', 'Household Services'),
  ('shopping-errands', 'Shopping & Errands', 'Grocery shopping and running errands', 'Household Services'),
  ('transportation', 'Transportation', 'Rides to appointments, shopping, and social activities', 'Household Services'),
  ('pet-care', 'Pet Care', 'Feeding, walking, and caring for pets', 'Household Services'),
  
  -- Mobility & Physical Support
  ('transfers', 'Transfers', 'Assistance moving between bed, chair, wheelchair, and other positions', 'Mobility & Physical Support'),
  ('ambulation-support', 'Ambulation Support', 'Help with walking and mobility assistance', 'Mobility & Physical Support'),
  ('repositioning', 'Repositioning', 'Regular repositioning to prevent bedsores and maintain comfort', 'Mobility & Physical Support'),
  ('exercise-assistance', 'Exercise Assistance', 'Support with prescribed exercises and physical therapy', 'Mobility & Physical Support'),
  
  -- Medical Care
  ('medication-reminders', 'Medication Reminders', 'Reminding clients to take medications on schedule', 'Medical Care'),
  ('medication-administration', 'Medication Administration', 'Administering medications by nurse or certified staff', 'Medical Care'),
  ('medication-monitoring', 'Medication Monitoring', 'Monitoring medication effectiveness and side effects', 'Medical Care'),
  ('prescription-management', 'Prescription Management', 'Managing prescription refills and medication schedules', 'Medical Care'),
  ('vital-signs-monitoring', 'Vital Signs Monitoring', 'Regular monitoring of blood pressure, temperature, and other vital signs', 'Medical Care'),
  ('wound-care', 'Wound Care', 'Cleaning and dressing wounds and injuries', 'Medical Care'),
  ('catheter-care', 'Catheter Care', 'Care and maintenance of catheters', 'Medical Care'),
  ('ostomy-care', 'Ostomy Care', 'Care and maintenance of ostomy bags and equipment', 'Medical Care'),
  ('feeding-tube-support', 'Feeding Tube Support', 'Assistance with feeding tube care and nutrition', 'Medical Care'),
  ('disease-management', 'Disease Management', 'Support managing chronic conditions and health issues', 'Medical Care'),
  
  -- Companionship & Social
  ('conversation-socialization', 'Conversation & Socialization', 'Engaging in conversation and social activities', 'Companionship & Social'),
  ('mental-stimulation', 'Mental Stimulation', 'Activities to keep the mind active and engaged', 'Companionship & Social'),
  ('accompaniment', 'Accompaniment', 'Providing companionship during activities and outings', 'Companionship & Social'),
  ('anxiety-reduction', 'Anxiety Reduction', 'Techniques and support to reduce anxiety and stress', 'Companionship & Social'),
  
  -- Specialized Care
  ('dementia-alzheimers-care', 'Dementia/Alzheimer''s Care', 'Specialized care for individuals with dementia or Alzheimer''s', 'Specialized Care'),
  ('palliative-hospice-support', 'Palliative/Hospice Support', 'Comfort care and support for end-of-life needs', 'Specialized Care'),
  ('post-hospitalization-care', 'Post-Hospitalization Care', 'Recovery support after hospital discharge', 'Specialized Care'),
  ('stroke-recovery-assistance', 'Stroke Recovery Assistance', 'Specialized support for stroke recovery and rehabilitation', 'Specialized Care'),
  ('developmental-disabilities-support', 'Developmental Disabilities Support', 'Care for individuals with developmental disabilities', 'Specialized Care'),
  ('autism-care', 'Autism Care', 'Specialized care for children and adults with autism', 'Specialized Care'),
  
  -- Care Coordination
  ('care-plan-coordination', 'Care Plan Coordination', 'Coordinating and managing comprehensive care plans', 'Care Coordination'),
  ('respite-care', 'Respite Care', 'Temporary care to give family caregivers a break', 'Care Coordination'),
  ('family-coaching', 'Family Coaching', 'Educating and supporting family members in caregiving', 'Care Coordination'),
  ('documentation', 'Documentation', 'Maintaining records and documentation of care provided', 'Care Coordination')
on conflict (slug) do nothing;


