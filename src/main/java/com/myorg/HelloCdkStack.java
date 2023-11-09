package com.myorg;

import software.amazon.awscdk.RemovalPolicy;
import software.constructs.Construct;
import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.s3.Bucket;

public class HelloCdkStack extends Stack {
    public HelloCdkStack(final Construct scope, final String id) {
        this(scope, id, null);
    }

    public HelloCdkStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // The code that defines your stack goes here
        Bucket.Builder.create(this,"cdk-test-001").bucketName("cdk-mmt-test")
                .versioned(true).removalPolicy(RemovalPolicy.DESTROY).autoDeleteObjects(true).build();

    }
}
