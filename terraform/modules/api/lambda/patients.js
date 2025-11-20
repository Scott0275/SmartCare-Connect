const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = process.env.DYNAMODB_TABLE;

exports.handler = async (event) => {
  const { httpMethod, pathParameters, body } = event;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
  };
  
  try {
    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          return await getPatient(pathParameters.id, headers);
        }
        return await getAllPatients(headers);
      
      case 'POST':
        return await createPatient(JSON.parse(body), headers);
      
      case 'PUT':
        return await updatePatient(pathParameters.id, JSON.parse(body), headers);
      
      case 'DELETE':
        return await deletePatient(pathParameters.id, headers);
      
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

async function getPatient(id, headers) {
  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: { id }
  });
  
  const result = await docClient.send(command);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Item || {})
  };
}

async function getAllPatients(headers) {
  const command = new ScanCommand({
    TableName: TABLE_NAME
  });
  
  const result = await docClient.send(command);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify(result.Items || [])
  };
}

async function createPatient(patientData, headers) {
  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      ...patientData,
      id: patientData.id || require("crypto").randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  });
  
  await docClient.send(command);
  return {
    statusCode: 201,
    headers,
    body: JSON.stringify({ message: 'Patient created successfully' })
  };
}

async function updatePatient(id, updates, headers) {
  const command = new UpdateCommand({
    TableName: TABLE_NAME,
    Key: { id },
    UpdateExpression: 'SET #updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: { ':updatedAt': new Date().toISOString() }
  });
  
  // Add update fields dynamically
  const updateFields = Object.keys(updates);
  if (updateFields.length > 0) {
    const setExpressions = updateFields.map(field => `#${field} = :${field}`);
    command.UpdateExpression = `SET ${setExpressions.join(', ')}, #updatedAt = :updatedAt`;
    
    updateFields.forEach(field => {
      command.ExpressionAttributeNames[`#${field}`] = field;
      command.ExpressionAttributeValues[`:${field}`] = updates[field];
    });
  }
  
  await docClient.send(command);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Patient updated successfully' })
  };
}

async function deletePatient(id, headers) {
  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: { id }
  });
  
  await docClient.send(command);
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Patient deleted successfully' })
  };
}