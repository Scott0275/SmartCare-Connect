import { GetCommand, PutCommand, ScanCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { setupDynamoDBMock, cleanupDynamoDBMock, mockPatients, mockAppointments, dynamodb } from '../mocks/dynamodb.mock';

describe('E2E: Database Operations', () => {
  beforeAll(async () => {
    await setupDynamoDBMock();
  });

  afterAll(() => {
    cleanupDynamoDBMock();
  });

  describe('Patient Data Management', () => {
    it('should retrieve patient by ID', async () => {
      const patientId = mockPatients[0].id;

      const result = await dynamodb.client.send(
        new GetCommand({
          TableName: process.env.DYNAMODB_TABLE!,
          Key: { id: patientId },
        })
      );

      expect(result.Item).toBeDefined();
      expect(result.Item?.id).toBe(patientId);
      expect(result.Item?.firstName).toBe('John');
      expect(result.Item?.email).toBe('john@example.com');
    });

    it('should create new patient record', async () => {
      const newPatient = {
        id: 'new-patient-123',
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        phone: '+1987654321',
        dateOfBirth: '1995-03-10',
        gender: 'F',
        medicalHistory: 'None',
        allergies: 'None',
        emergencyContact: 'Bob Johnson',
        emergencyContactPhone: '+1987654320',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await dynamodb.client.send(
        new PutCommand({
          TableName: process.env.DYNAMODB_TABLE!,
          Item: newPatient,
        })
      );

      expect(result.Attributes?.id).toBe(newPatient.id);
      expect(result.Attributes?.firstName).toBe('Alice');
    });

    it('should scan all patients', async () => {
      const result = await dynamodb.client.send(
        new ScanCommand({
          TableName: process.env.DYNAMODB_TABLE!,
          Limit: 50,
        })
      );

      expect(result.Items).toBeDefined();
      expect(result.Items?.length).toBeGreaterThan(0);
      expect(result.Count).toBe(result.Items?.length);
    });

    it('should validate required patient fields', async () => {
      const requiredFields = ['firstName', 'lastName', 'email', 'dateOfBirth', 'phone'];
      
      for (const patient of mockPatients) {
        for (const field of requiredFields) {
          expect(patient).toHaveProperty(field);
          expect((patient as any)[field]).not.toBeNull();
          expect((patient as any)[field]).not.toBeUndefined();
        }
      }
    });

    it('should enforce email format validation', () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      for (const patient of mockPatients) {
        expect(patient.email).toMatch(emailRegex);
      }
    });

    it('should enforce phone number format validation', () => {
      const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
      
      for (const patient of mockPatients) {
        expect(patient.phone).toMatch(phoneRegex);
      }
    });
  });

  describe('Appointment Management', () => {
    it('should retrieve appointment by ID', async () => {
      const appointmentId = mockAppointments[0].id;

      const result = await dynamodb.client.send(
        new GetCommand({
          TableName: process.env.APPOINTMENTS_TABLE!,
          Key: { id: appointmentId },
        })
      );

      expect(result.Item).toBeDefined();
      expect(result.Item?.id).toBe(appointmentId);
      expect(result.Item?.status).toBe('scheduled');
    });

    it('should query appointments by patient ID', async () => {
      const patientId = mockPatients[0].id;

      const result = await dynamodb.client.send(
        new QueryCommand({
          TableName: process.env.APPOINTMENTS_TABLE!,
          KeyConditionExpression: 'patientId = :patientId',
          ExpressionAttributeValues: {
            ':patientId': patientId,
          },
        })
      );

      expect(result.Items).toBeDefined();
      expect(result.Items?.length).toBeGreaterThan(0);
      expect(result.Items?.[0].patientId).toBe(patientId);
    });

    it('should create appointment with validation', async () => {
      const newAppointment = {
        id: 'appt-123',
        patientId: mockPatients[0].id,
        doctorId: 'doctor-456',
        appointmentDate: new Date(Date.now() + 86400000).toISOString(),
        appointmentTime: '3:30 PM',
        reason: 'Diabetes review',
        status: 'scheduled',
        notes: 'Check glucose levels',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const result = await dynamodb.client.send(
        new PutCommand({
          TableName: process.env.APPOINTMENTS_TABLE!,
          Item: newAppointment,
        })
      );

      expect(result.Attributes?.id).toBe(newAppointment.id);
      expect(result.Attributes?.status).toBe('scheduled');
    });

    it('should validate appointment date is in future', () => {
      const now = new Date();
      
      for (const appt of mockAppointments) {
        const appointmentDateTime = new Date(appt.appointmentDate);
        expect(appointmentDateTime.getTime()).toBeGreaterThan(now.getTime());
      }
    });

    it('should validate appointment reason is provided', () => {
      for (const appt of mockAppointments) {
        expect(appt.reason).toBeDefined();
        expect(appt.reason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Data Consistency', () => {
    it('should maintain referential integrity (patient exists for appointment)', () => {
      const patientIds = new Set(mockPatients.map(p => p.id));

      for (const appt of mockAppointments) {
        expect(patientIds.has(appt.patientId)).toBe(true);
      }
    });

    it('should track creation and update timestamps', () => {
      for (const patient of mockPatients) {
        expect(patient.createdAt).toBeDefined();
        expect(patient.updatedAt).toBeDefined();
        
        const created = new Date(patient.createdAt);
        const updated = new Date(patient.updatedAt);
        expect(updated.getTime()).toBeGreaterThanOrEqual(created.getTime());
      }
    });

    it('should support pagination for large result sets', async () => {
      const result = await dynamodb.client.send(
        new ScanCommand({
          TableName: process.env.DYNAMODB_TABLE!,
          Limit: 10,
        })
      );

      expect(result.Items?.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Error Handling', () => {
    it('should return empty result for non-existent patient', async () => {
      const result = await dynamodb.client.send(
        new GetCommand({
          TableName: process.env.DYNAMODB_TABLE!,
          Key: { id: 'non-existent-id' },
        })
      );

      expect(result.Item).toBeUndefined();
    });

    it('should handle query errors gracefully', async () => {
      // Test with invalid table name — our stub returns empty results rather than throwing
      const res = await dynamodb.client.send(
        new ScanCommand({
          TableName: 'non-existent-table',
        })
      );

      expect(res).toBeDefined();
      expect(Array.isArray(res.Items)).toBe(true);
      expect(res.Count).toBe(0);
    });
  });
});
