import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";


export class MyProjectStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //create table to store data in dynamodb
    const table = new ddb.Table(this, "Tasks", {
      partitionKey: {name: "task_id", type: ddb.AttributeType.STRING},
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: "ttl",
    });

    // Add GSI based on user_id
    table.addGlobalSecondaryIndex({
      indexName: "user-index",
      partitionKey: {name: "user_id", type: ddb.AttributeType.STRING},
      sortKey: {name: "created_time", type: ddb.AttributeType.NUMBER}
    });
    
    // create lambda function for the api
    const api = new lambda.Function(this, "API", {
      runtime: lambda.Runtime.PYTHON_3_10,
      code: lambda.Code.fromAsset("../api"),
      handler: "todo.handler",
      environment: {
        TABLE_NAME: table.tableName,
      }
    });

    // Create a url so we can access the function
    const functionUrl = api.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedHeaders: ["*"],
      }
    })

  }
}
