import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ 
  region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-2'
});

const docClient = DynamoDBDocumentClient.from(client);

export class DynamoDBService {
  private getTableName(collection: string): string {
    const project = process.env.NEXT_PUBLIC_PROJECT_NAME || 'smartcare';
    const env = process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NEXT_PUBLIC_ENV || 'dev';
    // table naming pattern matches Terraform: <project>-<environment>-<collection>
    return `${project}-${env}-${collection}`;
  }

  async createDocument(collection: string, item: any): Promise<string> {
    const id = item.id || crypto.randomUUID();
    const tableName = this.getTableName(collection);
    
    const command = new PutCommand({
      TableName: tableName,
      Item: {
        ...item,
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });
    
    await docClient.send(command);
    return id;
  }

  async getDocument(collection: string, id: string): Promise<any> {
    const command = new GetCommand({
      TableName: this.getTableName(collection),
      Key: { id }
    });
    
    const result = await docClient.send(command);
    return result.Item;
  }

  async updateDocument(collection: string, id: string, updates: any): Promise<void> {
    const updateExpression = Object.keys(updates).map(key => `#${key} = :${key}`).join(', ');
    const expressionAttributeNames = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`#${key}`]: key }), {});
    const expressionAttributeValues = Object.keys(updates).reduce((acc, key) => ({ ...acc, [`:${key}`]: updates[key] }), {});

    const command = new UpdateCommand({
      TableName: this.getTableName(collection),
      Key: { id },
      UpdateExpression: `SET ${updateExpression}, updatedAt = :updatedAt`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: { ...expressionAttributeValues, ':updatedAt': new Date().toISOString() }
    });
    
    await docClient.send(command);
  }

  async deleteDocument(collection: string, id: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.getTableName(collection),
      Key: { id }
    });
    
    await docClient.send(command);
  }

  async getAllDocuments(collection: string): Promise<any[]> {
    const command = new ScanCommand({
      TableName: this.getTableName(collection)
    });
    
    const result = await docClient.send(command);
    return result.Items || [];
  }

  async queryByIndex(collection: string, indexName: string, keyCondition: any): Promise<any[]> {
    const command = new QueryCommand({
      TableName: this.getTableName(collection),
      IndexName: indexName,
      KeyConditionExpression: keyCondition.expression,
      ExpressionAttributeValues: keyCondition.values
    });
    
    const result = await docClient.send(command);
    return result.Items || [];
  }

  // Specific queries for medical data
  async getPatientsByDoctor(doctorId: string): Promise<any[]> {
    return this.queryByIndex('patients', 'DoctorIndex', {
      expression: 'doctorId = :doctorId',
      values: { ':doctorId': doctorId }
    });
  }

  async getPrescriptionsByPatient(patientId: string): Promise<any[]> {
    return this.queryByIndex('prescriptions', 'PatientIndex', {
      expression: 'patientId = :patientId',
      values: { ':patientId': patientId }
    });
  }

  async getVitalsByPatient(patientId: string): Promise<any[]> {
    return this.queryByIndex('vitals', 'PatientIndex', {
      expression: 'patientId = :patientId',
      values: { ':patientId': patientId }
    });
  }

  async getAppointmentsByDate(date: string): Promise<any[]> {
    return this.queryByIndex('appointments', 'DateIndex', {
      expression: '#date = :date',
      values: { ':date': date }
    });
  }
}

export const dynamoService = new DynamoDBService();