import { 
  GetCommand, 
  PutCommand, 
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';

// Lightweight id generator to avoid ESM uuid parsing issues in Jest
function genId(prefix = '') {
  return `${prefix}${Date.now().toString(36)}-${Math.floor(Math.random() * 100000).toString(36)}`;
}

export const mockPatients = [
  {
    id: genId('patient-'),
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    dateOfBirth: '1990-01-15',
    gender: 'M',
    medicalHistory: 'Diabetes, Hypertension',
    allergies: 'Penicillin',
    emergencyContact: 'Jane Doe',
    emergencyContactPhone: '+1234567891',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: genId('patient-'),
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '+1234567892',
    dateOfBirth: '1985-05-20',
    gender: 'F',
    medicalHistory: 'Asthma',
    allergies: 'Aspirin',
    emergencyContact: 'John Smith',
    emergencyContactPhone: '+1234567893',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAppointments = [
  {
    id: genId('appt-'),
    patientId: mockPatients[0].id,
    doctorId: 'doctor-123',
    appointmentDate: new Date(Date.now() + 86400000).toISOString(),
    appointmentTime: '10:00 AM',
    reason: 'Regular checkup',
    status: 'scheduled',
    notes: 'Patient reports good health',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: genId('appt-'),
    patientId: mockPatients[1].id,
    doctorId: 'doctor-124',
    appointmentDate: new Date(Date.now() + 172800000).toISOString(),
    appointmentTime: '2:00 PM',
    reason: 'Follow-up asthma review',
    status: 'scheduled',
    notes: 'Check medication efficacy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockUsers = [
  {
    id: 'user-123',
    email: 'testuser@example.com',
    role: 'patient',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Provide a lightweight in-memory DynamoDB-like stub for tests.
export const dynamodb = {
  client: {
    send: async (command: any) => {
      const cmdName = command.constructor?.name;
      const input = command.input || command;

      // Handle GetCommand
      if (cmdName === 'GetCommand') {
        const { TableName, Key } = input;
        if (TableName === process.env.DYNAMODB_TABLE) {
          const item = mockPatients.find(p => p.id === Key.id);
          if (!item) {
            // Simulate DynamoDB behavior for missing item
            return { Item: undefined };
          }
          return { Item: item };
        }
        if (TableName === process.env.APPOINTMENTS_TABLE) {
          const appt = mockAppointments.find(a => a.id === Key.id);
          return { Item: appt };
        }
        return { Item: undefined };
      }

      // Handle QueryCommand
      if (cmdName === 'QueryCommand') {
        const { TableName } = input;
        if (TableName === process.env.APPOINTMENTS_TABLE) {
          return { Items: mockAppointments, Count: mockAppointments.length };
        }
        return { Items: [], Count: 0 };
      }

      // Handle ScanCommand
      if (cmdName === 'ScanCommand') {
        const { TableName } = input;
        if (TableName === process.env.DYNAMODB_TABLE) {
          return { Items: mockPatients, Count: mockPatients.length };
        }
        if (TableName === process.env.APPOINTMENTS_TABLE) {
          return { Items: mockAppointments, Count: mockAppointments.length };
        }
        return { Items: [], Count: 0 };
      }

      // Handle PutCommand
      if (cmdName === 'PutCommand') {
        const { TableName, Item } = input;
        // Simulate insert
        return { Attributes: Item };
      }

      // Handle UpdateCommand
      if (cmdName === 'UpdateCommand') {
        return { Attributes: { ...mockPatients[0] } };
      }

      // Handle DeleteCommand
      if (cmdName === 'DeleteCommand') {
        return {};
      }

      // Default fallback
      return {};
    }
  }
};

export async function setupDynamoDBMock() {
  // install aws-sdk-client-mock for DynamoDBDocumentClient so code that
  // uses @aws-sdk/lib-dynamodb is intercepted during tests
  try {
    const { mockClient } = require('aws-sdk-client-mock');
    const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

    const ddbMock = mockClient(DynamoDBDocumentClient);

    ddbMock.reset();

    ddbMock.on(ScanCommand).callsFake((cmd: any) => {
      const table = cmd.input?.TableName || cmd.TableName;
      if (table === process.env.DYNAMODB_TABLE) return { Items: mockPatients, Count: mockPatients.length };
      if (table === process.env.USERS_TABLE) return { Items: mockUsers, Count: mockUsers.length };
      if (table === process.env.APPOINTMENTS_TABLE) return { Items: mockAppointments, Count: mockAppointments.length };
      return { Items: [], Count: 0 };
    });

    ddbMock.on(GetCommand).callsFake((cmd: any) => {
      const { TableName, Key } = cmd.input || cmd;
      if (TableName === process.env.DYNAMODB_TABLE) {
        const item = mockPatients.find(p => p.id === Key.id);
        return { Item: item };
      }
      if (TableName === process.env.APPOINTMENTS_TABLE) {
        const item = mockAppointments.find(a => a.id === Key.id);
        return { Item: item };
      }
      return { Item: undefined };
    });

    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});
    ddbMock.on(DeleteCommand).resolves({});
    ddbMock.on(QueryCommand).callsFake((cmd: any) => {
      const table = cmd.input?.TableName || cmd.TableName;
      if (table === process.env.APPOINTMENTS_TABLE) return { Items: mockAppointments, Count: mockAppointments.length };
      return { Items: [], Count: 0 };
    });
  } catch (err) {
    // If any import fails, leave the no-op behavior in place but surface warning
    console.warn('setupDynamoDBMock: unable to setup aws-sdk-client-mock, falling back to simple stub:', err?.message || err);
  }
}

export function cleanupDynamoDBMock() {
  // no-op
}
