import { forwardRef, Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TagController } from './tag.controller';
import { CityService } from './tag-city.service';
import { DivisionService } from './tag-division.service';
import { DivisionEntity } from './tag-division.entity';
import { CityEntity } from './tag-city.entity';
import { UserModule } from '../user/user.module';
import { TemplateModule } from '../template/template.module';

@Global()
@Module({
  imports: [
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([DivisionEntity]),
    TypeOrmModule.forFeature([CityEntity]),
    forwardRef(() => TemplateModule),
  ],
  providers: [DivisionService, CityService],
  exports: [DivisionService, CityService],
  controllers: [TagController],
})
export class TagModule {}
