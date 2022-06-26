import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../src/user/user.entity';
import { UserAuthEntity } from '../src/auth/user-auth.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/common/role';

/**
 * 针对 `AppController` 的端到端测试
 */
describe('AppController (e2e)', () => {
  let app: INestApplication;
  let userRepo: Repository<UserEntity>;
  let userAuthRepo: Repository<UserAuthEntity>;

  /**
   * `Before Each`: 构建测试应用
   */
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    userRepo = app.get(getRepositoryToken(UserEntity));
    userAuthRepo = app.get(getRepositoryToken(UserAuthEntity));
    await userRepo.delete({});
  });

  async function createUser(
    username: string,
    password: string,
    isRoot = false,
  ): Promise<{ user: UserEntity; auth: UserAuthEntity }> {
    const user = await userRepo.save({
      username,
      realname: username,
      email: `${username}@null.boot`,
      roles: [],
      isRoot,
    });
    const auth = await userAuthRepo.save({
      userId: user.id,
      password: await bcrypt.hash(password, 10),
    });
    return { user, auth };
  }

  async function login(username: string, password: string): Promise<string> {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username, password })
      .expect(201);
    expect(res.body?.token).toBeDefined();
    return res.body.token;
  }

  async function createUserAndLogin(
    username: string,
    password: string,
    isRoot = false,
  ): Promise<{ user: UserEntity; token: string }> {
    const { user } = await createUser(username, password, isRoot);
    return { user, token: await login(username, password) };
  }

  /**
   * 测试 `API auth/*`
   */
  it('API auth/*', async () => {
    const { user } = await createUser('root', 'root-pass');
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'root', password: 'root-pass' })
      .expect(201);
    const token = res.body?.token;
    expect(token).toBeDefined();

    const res2 = await request(app.getHttpServer())
      .post('/auth')
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(res2.body.profile).toEqual(res.body.profile);

    const res3 = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: user.id })
      .expect(201);
    expect(res3.body).toEqual({});
  });

  it('API user/*', async () => {
    const { token, user } = await createUserAndLogin('root', 'root-pass', true);

    const res = await request(app.getHttpServer())
      .get(`/user/${user.id}/profile`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body?.profile).toBeDefined();
    let profile = res.body.profile;

    const res2 = await request(app.getHttpServer())
      .post(`/user/${user.id}/profile`)
      .send({ username: 'root-new' })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(res2.body?.profile).toEqual({ ...profile, username: 'root-new' });
    profile = res2.body.profile;

    const res3 = await request(app.getHttpServer())
      .post(`/user/${user.id}/password`)
      .send({ password: 'root-pass-new' })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(res3.body).toEqual({});

    const res4 = await request(app.getHttpServer())
      .post(`/user/${user.id}/roles`)
      .send({ roles: [Role.ADMIN] })
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(res4.body?.profile).toEqual({ ...profile, roles: [Role.ADMIN] });
  });

  /**
   * `After Each`: 销毁应用
   */
  afterEach(async () => await app.close());
});
