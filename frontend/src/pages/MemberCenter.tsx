import { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Progress,
  Statistic,
  Tag,
  Button,
  List,
  Divider,
  message,
  Steps,
} from 'antd';
import {
  CrownOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  ArrowUpOutlined,
} from '@ant-design/icons';
import { memberAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

const MemberCenter = () => {
  const { user } = useAuthStore();
  const [memberInfo, setMemberInfo] = useState<any>(null);
  const [levels, setLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [infoRes, levelsRes] = await Promise.all([
        memberAPI.getMemberInfo(),
        memberAPI.getLevels(),
      ]);
      setMemberInfo(infoRes.data);
      setLevels(levelsRes.data || []);
    } catch (error) {
      message.error('加载会员信息失败');
    }
  };

  const handleCheckUpgrade = async () => {
    setLoading(true);
    try {
      const { data } = await memberAPI.checkUpgrade();
      if (data.upgraded) {
        message.success(data.message);
        loadData();
      } else {
        message.info('当前等级已是最高或暂不满足升级条件');
      }
    } catch (error) {
      message.error('检查升级失败');
    } finally {
      setLoading(false);
    }
  };

  const levelMap: Record<string, { name: string; color: string; icon: any }> = {
    normal: { name: '普通会员', color: '#999', icon: <CheckCircleOutlined /> },
    silver: { name: '银卡会员', color: '#c0c0c0', icon: <TrophyOutlined /> },
    gold: { name: '金卡会员', color: '#faad14', icon: <CrownOutlined /> },
    diamond: { name: '钻石会员', color: '#1890ff', icon: <CrownOutlined /> },
  };

  const currentLevelInfo = memberInfo ? levelMap[memberInfo.currentLevel] : null;

  const benefitLabels: Record<string, string> = {
    priorityDisplay: '优先展示',
    paymentDays: '账期天数',
    freeInspections: '免费检测次数',
    creditLimitMultiplier: '授信倍数',
    discountRate: '折扣率',
  };

  return (
    <div>
      {memberInfo && currentLevelInfo && (
        <Card style={{ marginBottom: 16, background: `linear-gradient(135deg, ${currentLevelInfo.color}22 0%, #fff 100%)` }}>
          <Row gutter={24} align="middle">
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 64,
                  color: currentLevelInfo.color,
                  marginBottom: 8,
                }}>
                  {currentLevelInfo.icon}
                </div>
                <Tag color={currentLevelInfo.color} style={{ fontSize: 16, padding: '4px 16px' }}>
                  {currentLevelInfo.name}
                </Tag>
              </div>
            </Col>
            <Col span={12}>
              <h2 style={{ marginBottom: 16 }}>
                你好，{user?.username}！
              </h2>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="年度交易额"
                    value={memberInfo.stats?.annualTransaction || 0}
                    precision={2}
                    prefix="¥"
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="信用评分"
                    value={memberInfo.stats?.creditScore || 0}
                    suffix="/100"
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="授信额度"
                    value={memberInfo.stats?.creditLimit || 0}
                    prefix="¥"
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>

              {memberInfo.nextLevel && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ marginBottom: 8 }}>
                    距离 <Tag color={levelMap[memberInfo.nextLevel]?.color}>
                      {levelMap[memberInfo.nextLevel]?.name}
                    </Tag> 还需：
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ display: 'inline-block', width: 100 }}>年度交易额：</span>
                    <Progress
                      style={{ display: 'inline-block', width: 300 }}
                      percent={Math.round(memberInfo.progress?.annualTransaction || 0)}
                      size="small"
                    />
                    <span style={{ marginLeft: 8, color: '#999' }}>
                      ¥{memberInfo.stats?.annualTransaction?.toLocaleString()} / ¥{memberInfo.nextRequirements?.annualTransaction?.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span style={{ display: 'inline-block', width: 100 }}>信用评分：</span>
                    <Progress
                      style={{ display: 'inline-block', width: 300 }}
                      percent={Math.round(memberInfo.progress?.creditScore || 0)}
                      size="small"
                    />
                    <span style={{ marginLeft: 8, color: '#999' }}>
                      {memberInfo.stats?.creditScore} / {memberInfo.nextRequirements?.creditScore}
                    </span>
                  </div>
                  <Button
                    type="primary"
                    icon={<ArrowUpOutlined />}
                    onClick={handleCheckUpgrade}
                    loading={loading}
                    style={{ marginTop: 16 }}
                  >
                    检查升级
                  </Button>
                </div>
              )}
            </Col>
            <Col span={6}>
              <Card size="small" title="当前权益">
                <List
                  size="small"
                  dataSource={Object.entries(memberInfo.benefits || {})}
                  renderItem={([key, value]: any) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                        title={
                          <span>
                            {benefitLabels[key] || key}
                            {typeof value === 'boolean' ? (value ? '：已开通' : '：未开通') : `：${value}`}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>
        </Card>
      )}

      <Card title="会员等级体系">
        <Steps
          direction="vertical"
          current={levels.findIndex((l: any) => l.level === memberInfo?.currentLevel)}
          items={levels.map((level: any) => ({
            title: level.name,
            description: (
              <div>
                <p>升级条件：</p>
                <ul>
                  <li>年度交易额 ≥ ¥{level.annualTransaction?.toLocaleString()}</li>
                  <li>信用评分 ≥ {level.creditScore}分</li>
                </ul>
                <p>专属权益：</p>
                <ul>
                  {level.benefits?.priorityDisplay && <li>商品优先展示</li>}
                  <li>账期延长至 {level.benefits?.paymentDays} 天</li>
                  <li>每年 {level.benefits?.freeInspections} 次免费检测</li>
                  <li>授信额度 {level.benefits?.creditLimitMultiplier} 倍</li>
                  {level.benefits?.discountRate > 0 && (
                    <li>交易折扣 {(level.benefits?.discountRate * 100).toFixed(0)}%</li>
                  )}
                </ul>
              </div>
            ),
            status: levels.findIndex((l: any) => l.level === memberInfo?.currentLevel) >= levels.indexOf(level) ? 'finish' : 'wait',
          }))}
        />
      </Card>
    </div>
  );
};

export default MemberCenter;
