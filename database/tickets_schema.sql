-- Table des demandes de validation (Admin)
CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    quantity INT NOT NULL,
    amount_paid INT NOT NULL,
    sender_phone TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending' ou 'approved'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des tickets finaux (Étudiants)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    ticket_code TEXT NOT NULL UNIQUE, 
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
