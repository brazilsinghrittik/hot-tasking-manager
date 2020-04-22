const cf = require('@mapbox/cloudfriend');

const Parameters = {
  GitSha: {
    Type: 'String'
  },
  NetworkEnvironment: {
    Type :'String',
    AllowedValues: ['staging', 'production']
  },
  AutoscalingPolicy: {
    Type: 'String',
    AllowedValues: ['development', 'demo', 'production'],
    Description: "development: min 1, max 1 instance; demo: min 1 max 3 instances; production: min 3 max 12 instances"
  },
  DBSnapshot: {
    Type: 'String',
    Description: 'Specify an RDS snapshot ID, if you want to create the DB from a snapshot.',
    Default: ''
  },
  DatabaseDump: {
    Type: 'String',
    Description: 'Path to database dump on S3'
  },
  NewRelicLicense: {
    Type: 'String',
    Description: 'NEW_RELIC_LICENSE'
  },
  PostgresDB: {
    Type: 'String',
    Description: 'POSTGRES_DB',
    Default: 'tm'
  },
  PostgresPassword: {
    Type: 'String',
    Description: 'POSTGRES_PASSWORD'
  },
  PostgresUser: {
    Type: 'String',
    Description: 'POSTGRES_USER',
    Default: 'taskingmanager'
  },
  TaskingManagerAppBaseUrl: {
    Type: 'String',
    Description: 'TM_APP_BASE_URL'
  },
  TaskingManagerApiVersion: {
    Type: 'String',
    Description: 'TM_APP_API_VERSION',
    Default: 'v2'
  },
  TaskingManagerConsumerKey: {
    Description: 'TM_CONSUMER_KEY',
    Type: 'String',
    Default: '86FeADYCgpgNufcP9MyOdqlIPjG3cX7AdFiTPhpr'
  },
  TaskingManagerConsumerSecret: {
      Description: 'TM_CONSUMER_SECRET',
      Type: 'String'
  },
  TaskingManagerSecret: {
    Description: 'TM_SECRET',
    Type: 'String'
  },
  TaskingManagerEmailFromAddress: {
    Description: 'TM_EMAIL_FROM_ADDRESS',
    Type: 'String',
    Default: 'noreply@hotosmmail.org'
  },
  TaskingManagerSMTPHost: {
    Description: 'TM_SMTP_HOST environment variable',
    Type: 'String',
    Default: 'email-smtp.us-east-1.amazonaws.com'
  },
  TaskingManagerSMTPPassword: {
    Description: 'TM_SMTP_PASSWORD environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPUser: {
    Description: 'TM_SMTP_USER environment variable',
    Type: 'String'
  },
  TaskingManagerSMTPPort: {
    Description: 'TM_SMTP_PORT environment variable',
    Type: 'String',
    Default: '587'
  },
  TaskingManagerDefaultChangesetComment: {
    Description: 'TM_DEFAULT_CHANGESET_COMMENT environment variable',
    Type: 'String'
  },
  TaskingManagerLogDirectory: {
    Description: 'TM_LOG_DIR environment variable',
    Type: 'String',
    Default: '/var/log/tasking-manager'
  },
  DatabaseSize: {
    Description: 'Database size in GB',
    Type: 'String',
    Default: '100'
  },
  ELBSubnets: {
    Description: 'ELB subnets',
    Type: 'String',
    Default: 'subnet-35b98b0f,subnet-47e2861e,subnet-5a119a3f,subnet-6ba8e81c,subnet-75902c79,subnet-f4f977df'
  },
  SSLCertificateIdentifier: {
    Type: 'String',
    Description: 'SSL certificate for HTTPS protocol',
    Default: 'certificate/1d74321b-1e5b-4e31-b97a-580deb39c539'
  },
  MatomoSiteID: {
    Type: 'String',
    Description: 'site id from matomo app'
  },
  MatomoEndpoint: {
    Type: 'String',
    Description: 'Endpoint URL for matomo tracking'
  },
  MapboxToken: {
    Type: 'String',
    Description: 'Mapbox Token'
  },
  OrgName: {
    Type: 'String',
    Description: 'OrgName'
  },
  OrgCode: {
    Type: 'String',
    Description: 'OrgCode',
    Default: 'HOT'
  },
  OrgUrl: {
    Type: 'String',
    Description: 'Org Url. Do not add http://',
    Default: 'hotosm.org'
  },
  OrgPrivacyPolicy: {
    Type: 'String',
    Description: 'PrivacyPolicy URL. Do not add http://',
    Default: 'hotosm.org/privacy'
  },
  OrgTwitter: {
    Type: 'String',
    Description: 'Twitter URL',
    Default: 'https://twitter.com/hotosm/'
  },
  OrgFacebook: {
    Type: 'String',
    Description: 'Facebook URL',
    Default: 'https://www.facebook.com/hotosm'
  },
  OrgInstagram: {
    Type: 'String',
    Description: 'Instagram URL',
    Default: 'https://www.instagram.com/hot.osm/'
  },
  OrgYoutube: {
    Type: 'String',
    Description: 'Youtube Url',
    Default: 'https://www.youtube.com/user/hotosm'
  },
  OrgGitHub: {
    Type: 'String',
    Description: 'Github URL',
    Default: 'https://github.com/hotosm/'
  }
};

const Conditions = {
  UseASnapshot: cf.notEquals(cf.ref('DBSnapshot'), ''),
  DatabaseDumpFileGiven: cf.notEquals(cf.ref('DatabaseDump'), ''),
  IsTaskingManagerProduction: cf.equals(cf.ref('AutoscalingPolicy'), 'Production (max 12)'),
  IsTaskingManagerDemo: cf.equals(cf.ref('AutoscalingPolicy'), 'Demo (max 3)')
};

const Resources = {
  TaskingManagerCodeDeployApplication: {  
    Type: 'AWS::CodeDeploy::Application',
    Properties: {
      ApplicationName: "TaskingManager4",
      ComputePlatform: "Server"
    }
  },
  TaskingManagerCodeDeployGroup: {
    Type: 'AWS::CodeDeploy::DeploymentGroup',
    Properties: {
      ApplicationName: cf.ref('TaskingManagerCodeDeployApplication'),
      AutoScalingGroups: [ cf.ref('TaskingManagerASG') ],
      LoadBalancerInfo: {
          ElbInfoList: [ { Name: cf.stackName } ],
      },
      DeploymentGroupName: 'TM4CDeployTest',
      ServiceRoleArn: 'arn:aws:iam::670261699094:role/CodeDeployRole',
    }
  },
  TaskingManagerASG: {
    DependsOn: 'TaskingManagerLaunchConfiguration',
    Type: 'AWS::AutoScaling::AutoScalingGroup',
    Properties: {
      AutoScalingGroupName: cf.stackName,
      Cooldown: 600,
      MinSize: cf.if('IsTaskingManagerProduction', 3, 1),
      DesiredCapacity: cf.if('IsTaskingManagerProduction', 3, 1),
      MaxSize: cf.if('IsTaskingManagerProduction', 12, cf.if('IsTaskingManagerDemo', 3, 1)),
      HealthCheckGracePeriod: 600,
      LaunchConfigurationName: cf.ref('TaskingManagerLaunchConfiguration'),
      TargetGroupARNs: [ cf.ref('TaskingManagerTargetGroup') ],
      HealthCheckType: 'EC2',
      AvailabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1f'],
      Tags: [
        { 'Key': 'backup-frequency', 'Value': 'daily', 'PropagateAtLaunch': true },
        { 'Key': 'Name', 'Value': cf.stackName, 'PropagateAtLaunch': true }
      ]
    },
    UpdatePolicy: {
      AutoScalingRollingUpdate: {
        PauseTime: 'PT60M',
        WaitOnResourceSignals: true
      }
    }
  },
  TaskingManagerScaleUp: {
      Type: "AWS::AutoScaling::ScalingPolicy",
      Properties: {
        AutoScalingGroupName: cf.ref('TaskingManagerASG'),
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 600,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ALBRequestCountPerTarget',
            ResourceLabel: cf.join('/', [
              cf.select(1,
                cf.split('loadbalancer/',
                  cf.select(5,
                    cf.split(':', cf.ref("TaskingManagerLoadBalancer"))
                  )
                )
              ),
              cf.select(5,
                cf.split(':', cf.ref("TaskingManagerTargetGroup"))
              )
            ])
          }
        },
        Cooldown: 600
      }
  },
  TaskingManagerLaunchConfiguration: {
    Type: "AWS::AutoScaling::LaunchConfiguration",
    Metadata: {
      "AWS::CloudFormation::Init": {
        "configSets": {
          "default": [
            "01_setupCfnHup",
            "02_config-amazon-cloudwatch-agent",
            "03_restart_amazon-cloudwatch-agent"
          ],
          "UpdateEnvironment": [
            "02_config-amazon-cloudwatch-agent",
            "03_restart_amazon-cloudwatch-agent"
            ]
        },
        // Definition of json configuration of AmazonCloudWatchAgent, you can change the configuration below.
        "02_config-amazon-cloudwatch-agent": {
          "files": {
            '/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json': {
              "content": cf.join("\n", [
                  "{\"logs\": {",
                  "\"logs_collected\": {",
                  "\"files\": {",
                  "\"collect_list\": [",
                  "{",
                  "\"file_path\": \"/opt/aws/amazon-cloudwatch-agent/logs/amazon-cloudwatch-agent.log\",",
                  cf.sub("\"log_group_name\": \"${AWS::StackName}.log\","),
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}-cloudwatch-agent.log\","),
                  "\"timezone\": \"UTC\"",
                  "},",
                  "{",
                  cf.sub("\"file_path\": \"${TaskingManagerLogDirectory}/tasking-manager.log\","),
                  cf.sub("\"log_group_name\": \"${AWS::StackName}.log\","),
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}.log\","),
                  "\"timezone\": \"UTC\"",
                  "}]}},",
                  cf.sub("\"log_stream_name\": \"${AWS::StackName}-logs\","),
                  "\"force_flush_interval\" : 15",
                  "}}"
              ])
            }
          }
        },
        // Invoke amazon-cloudwatch-agent-ctl to restart the AmazonCloudWatchAgent.
        "03_restart_amazon-cloudwatch-agent": {
          "commands": {
            "01_stop_service": {
              "command": "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a stop"
            },
            "02_start_service": {
              "command": "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
            }
          }
        },
        // Cfn-hup setting, it is to monitor the change of metadata.
        // When there is change in the contents of json file in the metadata section, cfn-hup will call cfn-init to restart the AmazonCloudWatchAgent.
        "01_setupCfnHup": {
          "files": {
            "/etc/cfn/cfn-hup.conf": {
              "content": cf.join('\n', [
                "[main]",
                cf.sub("stack=${!AWS::StackName}"),
                cf.sub("region=${!AWS::Region}"),
                "interval=1"
              ]),
              "mode": "000400",
              "owner": "root",
              "group": "root"
            },
            "/etc/cfn/hooks.d/amazon-cloudwatch-agent-auto-reloader.conf": {
              "content": cf.join('\n', [
                "[cfn-auto-reloader-hook]",
                "triggers=post.update",
                "path=Resources.EC2Instance.Metadata.AWS::CloudFormation::Init.02_config-amazon-cloudwatch-agent",
                cf.sub("action=cfn-init -v --stack ${AWS::StackName} --resource EC2Instance --region ${AWS::Region} --configsets UpdateEnvironment"),
                "runas=root"
              ]),
              "mode": "000400",
              "owner": "root",
              "group": "root"
            },
            "/lib/systemd/system/cfn-hup.service": {
              "content": cf.join('\n', [
                "[Unit]",
                "Description=cfn-hup daemon",
                "[Service]",
                "Type=simple",
                "ExecStart=/opt/aws/bin/cfn-hup",
                "Restart=always",
                "[Install]",
                "WantedBy=multi-user.target"
                ])
            }
          },
          "commands": {
            "01enable_cfn_hup": {
            "command": "systemctl enable cfn-hup.service"
            },
            "02start_cfn_hup": {
              "command": "systemctl start cfn-hup.service"
            }
          }
        }
      }
    },
    Properties: {
      IamInstanceProfile: cf.ref('TaskingManagerEC2InstanceProfile'),
      LaunchConfigurationName: cf.stackName,
      ImageId: 'ami-07ebfd5b3428b6f4d',
      InstanceType: 'c5.large',
      SecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'ec2s-security-group', cf.region]))],
      UserData: cf.userData([
        '#!/bin/bash',
        'set -x',
        'export DEBIAN_FRONTEND=noninteractive',
        'export LC_ALL="en_US.UTF-8"',
        'export LC_CTYPE="en_US.UTF-8"',
        'dpkg-reconfigure --frontend=noninteractive locales',
        'wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -',
        'sudo sh -c \'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -sc)-pgdg main" > /etc/apt/sources.list.d/PostgreSQL.list\'',
        'sudo apt-get -y update',
        'sudo DEBIAN_FRONTEND=noninteractive apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" upgrade',
        'sudo apt-get -y install python3 python3-pip python3-dev python3-venv',
        'sudo apt-get -y install python-pip',
        'sudo apt-get -y install curl',
        'curl -o install-node10.sh -sL https://deb.nodesource.com/setup_10.x',
        'sudo chmod +x install-node10.sh',
        'sudo ./install-node10.sh',
        'sudo apt-get -y install nodejs',
        'sudo apt-get -y install postgresql-11 postgresql-11-postgis-3 postgresql-11-postgis-3-scripts',
        'sudo apt-get -y install postgis',
        'sudo apt-get -y install libpq-dev',
        'sudo apt-get -y install libxml2',
        'sudo apt-get -y install wget libxml2-dev',
        'sudo apt-get -y install libgeos-3.6.2',
        'sudo apt-get -y install libgeos-dev',
        'sudo apt-get -y install libproj9',
        'sudo apt-get -y install libproj-dev',
        'sudo apt-get -y install libgdal-dev',
        'sudo apt-get -y install libjson-c-dev',
        'sudo apt-get -y install git',
        'sudo apt-get -y install awscli',
        'sudo apt-get -y install ruby',
        'pushd /home/ubuntu',
        'wget https://aws-codedeploy-us-east-1.s3.us-east-1.amazonaws.com/latest/install',
        'chmod +x ./install && sudo ./install auto',
        'sudo systemctl start codedeploy-agent',
        'popd',
        'echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf',
        'export LC_ALL=C',
        'wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -O /tmp/amazon-cloudwatch-agent.deb',
        'dpkg -i /tmp/amazon-cloudwatch-agent.deb',
        'wget https://s3.amazonaws.com/cloudformation-examples/aws-cfn-bootstrap-latest.tar.gz',
        'pip install aws-cfn-bootstrap-latest.tar.gz',
        'echo "Exporting environment variables:"',
        cf.sub('echo "NEW_RELIC_LICENSE=${NewRelicLicense}" | tee /opt/tasking-manager.env'),
        cf.join('', ['echo "POSTGRES_ENDPOINT=', cf.getAtt('TaskingManagerRDS','Endpoint.Address'), '" | tee -a /opt/tasking-manager.env']),
        cf.sub('echo "POSTGRES_DB=${PostgresDB}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "POSTGRES_PASSWORD=${PostgresPassword}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "POSTGRES_USER=${PostgresUser}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_APP_BASE_URL=${TaskingManagerAppBaseUrl}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_APP_API_VERSION=${TaskingManagerApiVersion}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_CONSUMER_KEY=${TaskingManagerConsumerKey}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_CONSUMER_SECRET=${TaskingManagerConsumerSecret}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_EMAIL_FROM_ADDRESS=${TaskingManagerEmailFromAddress}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_LOG_DIR=${TaskingManagerLogDirectory}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_SECRET=${TaskingManagerSecret}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_SMTP_HOST=${TaskingManagerSMTPHost}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_SMTP_PASSWORD=${TaskingManagerSMTPPassword}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_SMTP_PORT=${TaskingManagerSMTPPort}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_SMTP_USER=${TaskingManagerSMTPUser}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_DEFAULT_CHANGESET_COMMENT=${TaskingManagerDefaultChangesetComment}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_MATOMO_ID=${MatomoSiteID}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_MATOMO_ENDPOINT=${MatomoEndpoint}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_MAPBOX_TOKEN=${MapboxToken}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_NAME=${OrgName}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_CODE=${OrgCode}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_URL=${OrgUrl}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_PRIVACY_POLICY=${OrgPrivacyPolicy}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_TWITTER=${OrgTwitter}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_FB=${OrgFacebook}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_INSTAGRAM=${OrgInstagram}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_YOUTUBE=${OrgYoutube}" | tee -a /opt/tasking-manager.env'),
        cf.sub('echo "TM_ORG_GITHUB=${OrgGitHub}" | tee -a /opt/tasking-manager.env'),
        'source /opt/tasking-manager.env',
        'psql "host=$POSTGRES_ENDPOINT dbname=$POSTGRES_DB user=$POSTGRES_USER password=$POSTGRES_PASSWORD" -c "CREATE EXTENSION IF NOT EXISTS postgis"',
        cf.if('DatabaseDumpFileGiven', cf.sub('aws s3 cp ${DatabaseDump} dump.sql; sudo -u postgres psql "postgresql://$POSTGRES_USER:$POSTGRES_PASSWORD@$POSTGRES_ENDPOINT/$POSTGRES_DB" < dump.sql'), ''),
        cf.sub('sudo cfn-init -v --stack ${AWS::StackName} --resource TaskingManagerLaunchConfiguration --region ${AWS::Region} --configsets default'),
        cf.sub('cfn-signal --exit-code $? --region ${AWS::Region} --resource TaskingManagerASG --stack ${AWS::StackName}')
      ]),
      KeyName: 'mbtiles'
    }
  },
  TaskingManagerEC2Role: {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
             Service: [ "ec2.amazonaws.com" ]
          },
          Action: [ "sts:AssumeRole" ]
        }]
      },
      ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy',
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      ],
      Policies: [{
        PolicyName: "RDSPolicy",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: ['rds:DescribeDBInstances'],
            Effect: 'Allow',
            Resource: ['arn:aws:rds:*']
          }]
        }
      }, {
        PolicyName: "CloudFormationPermissions",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: [
              'cloudformation:SignalResource',
              'cloudformation:DescribeStackResource'
            ],
            Effect: 'Allow',
            Resource: ['arn:aws:cloudformation:*']
          }]
        }
      }
      ],
      RoleName: cf.join('-', [cf.stackName, 'ec2', 'role'])
    }
  },
  TaskingManagerDatabaseDumpAccessRole: {
    Condition: 'DatabaseDumpFileGiven',
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: {
        Version: "2012-10-17",
        Statement: [{
          Effect: "Allow",
          Principal: {
             Service: [ "ec2.amazonaws.com" ]
          },
          Action: [ "sts:AssumeRole" ]
        }]
      },
      ManagedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AmazonEC2RoleforAWSCodeDeploy',
          'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
          'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      ],
      Policies: [{
        PolicyName: "RDSPolicy",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: ['rds:DescribeDBInstances'],
            Effect: 'Allow',
            Resource: ['arn:aws:rds:*']
          }]
        }
      }, {
        PolicyName: "CloudFormationPermissions",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: [
              'cloudformation:SignalResource',
              'cloudformation:DescribeStackResource'
            ],
            Effect: 'Allow',
            Resource: ['arn:aws:cloudformation:*']
          }]
        }
      }, {
        PolicyName: "AccessToDatabaseDump",
        PolicyDocument: {
          Version: "2012-10-17",
          Statement:[{
            Action: [ 's3:ListBucket'],
            Effect: 'Allow',
            Resource: [ cf.join('',
              ['arn:aws:s3:::',
                cf.select(2, cf.split('/', cf.ref('DatabaseDump')))
              ]
            )]
          }, {
            Action: [
              's3:GetObject',
              's3:GetObjectAcl',
              's3:ListObjects',
              's3:ListBucket'
            ],
            Effect: 'Allow',
            Resource: [cf.join('',
              ['arn:aws:s3:::',
                cf.select(1,
                  cf.split('s3://', cf.ref('DatabaseDump'))
              )]
            )]
          }]
        }
      }],
      RoleName: cf.join('-', [cf.stackName, 'ec2', 'database-dump-access', 'role'])
    }
  },
  TaskingManagerEC2InstanceProfile: {
     Type: "AWS::IAM::InstanceProfile",
     Properties: {
        Roles: cf.if('DatabaseDumpFileGiven', [cf.ref('TaskingManagerDatabaseDumpAccessRole')], [cf.ref('TaskingManagerEC2Role')]),
        InstanceProfileName: cf.join('-', [cf.stackName, 'ec2', 'instance', 'profile'])
     }
  },
  TaskingManagerLoadBalancer: {
    Type: 'AWS::ElasticLoadBalancingV2::LoadBalancer',
    Properties: {
      Name: cf.stackName,
      SecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'elbs-security-group', cf.region]))],
      Subnets: cf.split(',', cf.ref('ELBSubnets')),
      Type: 'application'
    }
  },
  TaskingManagerTargetGroup: {
    Type: 'AWS::ElasticLoadBalancingV2::TargetGroup',
    Properties: {
      HealthCheckIntervalSeconds: 60,
      HealthCheckPort: 8000,
      HealthCheckProtocol: 'HTTP',
      HealthCheckTimeoutSeconds: 10,
      HealthyThresholdCount: 3,
      UnhealthyThresholdCount: 3,
      Port: 8000,
      Protocol: 'HTTP',
      VpcId: cf.importValue(cf.join('-', ['hotosm-network-production', 'default-vpc', cf.region])),
      Matcher: {
        HttpCode: '200,202,302,304'
      }
    }
  },
  TaskingManagerLoadBalancerHTTPSListener: {
    Type: 'AWS::ElasticLoadBalancingV2::Listener',
    Properties: {
      Certificates: [ {
        CertificateArn: cf.arn('acm', cf.ref('SSLCertificateIdentifier'))
      }],
      DefaultActions: [{
        Type: 'forward',
        TargetGroupArn: cf.ref('TaskingManagerTargetGroup')
      }],
      LoadBalancerArn: cf.ref('TaskingManagerLoadBalancer'),
      Port: 443,
      Protocol: 'HTTPS'
    }
  },
  TaskingManagerLoadBalancerHTTPListener: {
    Type: 'AWS::ElasticLoadBalancingV2::Listener',
    Properties: {
      DefaultActions: [{
        Type: 'redirect',
        RedirectConfig: {
          Protocol: 'HTTPS',
          Port: '443',
          Host: '#{host}',
          Path: '/#{path}',
          Query: '#{query}',
          StatusCode: 'HTTP_301'
        }
      }],
      LoadBalancerArn: cf.ref('TaskingManagerLoadBalancer'),
      Port: 80,
      Protocol: 'HTTP'
    }
  },
  TaskingManagerRDS: {
    Type: 'AWS::RDS::DBInstance',
    Properties: {
        Engine: 'postgres',
        DBName: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresDB')),
        EngineVersion: '11.5',
        MasterUsername: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresUser')),
        MasterUserPassword: cf.if('UseASnapshot', cf.noValue, cf.ref('PostgresPassword')),
        AllocatedStorage: cf.ref('DatabaseSize'),
        BackupRetentionPeriod: 10,
        StorageType: 'gp2',
        DBParameterGroupName: 'tm3-logging-postgres11',
        EnableCloudwatchLogsExports: ['postgresql'],
        DBInstanceClass: cf.if('IsTaskingManagerProduction', 'db.t3.2xlarge', 'db.t2.small'),
        DBSnapshotIdentifier: cf.if('UseASnapshot', cf.ref('DBSnapshot'), cf.noValue),
        VPCSecurityGroups: [cf.importValue(cf.join('-', ['hotosm-network-production', cf.ref('NetworkEnvironment'), 'ec2s-security-group', cf.region]))],
    }
  }
};

module.exports = { Parameters, Resources, Conditions }
