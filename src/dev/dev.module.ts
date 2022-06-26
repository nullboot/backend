import { forwardRef, Module } from '@nestjs/common';
import { DevController } from './dev.controller';
import { DevService } from './dev.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAuthEntity } from '../auth/user-auth.entity';
import { UserEntity } from '../user/user.entity';
import { TagModule } from '../tag/tag.module';
import { CityEntity } from '../tag/tag-city.entity';
import { DivisionEntity } from '../tag/tag-division.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    TypeOrmModule.forFeature([CityEntity]),
    TypeOrmModule.forFeature([DivisionEntity]),
    TypeOrmModule.forFeature([UserAuthEntity]),
    forwardRef(() => TagModule),
  ],
  controllers: [DevController],
  providers: [DevService],
})
export class DevModule {}
