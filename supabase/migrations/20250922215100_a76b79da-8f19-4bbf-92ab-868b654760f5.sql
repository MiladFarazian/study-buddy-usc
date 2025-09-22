-- Create refund calculation function
CREATE OR REPLACE FUNCTION calculate_refund_amounts(
  original_amount INTEGER,
  cancelled_by_role TEXT,
  hours_before INTEGER
) RETURNS TABLE(student_refund INTEGER, tutor_payout INTEGER) AS $$
BEGIN
  IF cancelled_by_role = 'tutor' OR cancelled_by_role = 'admin' THEN
    -- Tutor/admin cancellations: always 100% refund to student
    student_refund := original_amount;
    tutor_payout := 0;
  ELSIF cancelled_by_role = 'student' THEN
    IF hours_before >= 24 THEN
      -- Student cancels 24+ hours: 100% refund
      student_refund := original_amount;
      tutor_payout := 0;
    ELSIF hours_before >= 2 THEN
      -- Student cancels 2-24 hours: 50% refund, 50% to tutor
      student_refund := original_amount / 2;
      tutor_payout := original_amount / 2;
    ELSE
      -- Student cancels under 2 hours: no refund, 100% to tutor
      student_refund := 0;
      tutor_payout := original_amount;
    END IF;
  END IF;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;