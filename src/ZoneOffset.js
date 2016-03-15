/**
 * @copyright (c) 2016, Philipp Thuerwaechter & Pattrick Hueper
 * @copyright (c) 2007-present, Stephen Colebourne & Michael Nascimento Santos
 * @license BSD-3-Clause (see LICENSE in the root directory of this source tree)
 */

import {DateTimeException} from './errors';
import {MathUtil} from './MathUtil';

import {LocalTime} from './LocalTime';
import {ZoneId} from './ZoneId';

import {ZoneRules} from './zone/ZoneRules';

var SECONDS_CACHE = {};


/**
 *
 * <h3>Static properties of Class {@link LocalDate}</h3>
 *
 * ZoneOffset.MAX_SECONDS = 18 * LocalTime.SECONDS_PER_HOUR;
 *
 * ZoneOffset.UTC = ZoneOffset.ofTotalSeconds(0);
 *
 * ZoneOffset.MIN = ZoneOffset.ofTotalSeconds(-ZoneOffset.MAX_SECONDS);
 *
 * ZoneOffset.MAX = ZoneOffset.ofTotalSeconds(ZoneOffset.MAX_SECONDS);
 *
 */
export class ZoneOffset extends ZoneId {
    /**
     * 
     * @param {number} totalSeconds
     */
    constructor(totalSeconds){
        super();
        ZoneOffset._validateTotalSeconds(totalSeconds);
        this._totalSeconds = totalSeconds;
        this._rules = ZoneRules.of(this);
        this._id = ZoneOffset._buildId(totalSeconds);
    }

    /**
     * 
     * @returns {number}
     */
    totalSeconds() {
        return this._totalSeconds;
    }

    /**
     *
     * @returns {string}
     */
    id() {
        return this._id;
    }

    /**
     *
     * @param {number} totalSeconds
     * @returns {string}
     */
    static _buildId(totalSeconds) {
        if (totalSeconds === 0) {
            return 'Z';
        } else {
            var absTotalSeconds = Math.abs(totalSeconds);
            var absHours = MathUtil.intDiv(absTotalSeconds, LocalTime.SECONDS_PER_HOUR);
            var absMinutes = MathUtil.intMod(MathUtil.intDiv(absTotalSeconds, LocalTime.SECONDS_PER_MINUTE), LocalTime.MINUTES_PER_HOUR);
            var buf = '' + (totalSeconds < 0 ? '-' : '+')
                + (absHours < 10 ? '0' : '') + (absHours)
                + (absMinutes < 10 ? ':0' : ':') + (absMinutes);
            var absSeconds = MathUtil.intMod(absTotalSeconds, LocalTime.SECONDS_PER_MINUTE);
            if (absSeconds !== 0) {
                buf += (absSeconds < 10 ? ':0' : ':') + (absSeconds);
            }
            return buf.toString();
        }
    }


    /**
     * 
     * @param {number} totalSeconds
     * @private
     */
    static _validateTotalSeconds(totalSeconds){
        if (Math.abs(totalSeconds) > ZoneOffset.MAX_SECONDS) {
            throw new DateTimeException('Zone offset not in valid range: -18:00 to +18:00');
        }
    }

    /**
     * 
     * @param {number} hours
     * @param {number} minutes
     * @param {number} seconds
     * @private
     */
    static _validate(hours, minutes, seconds) {
        if (hours < -18 || hours > 18) {
            throw new DateTimeException('Zone offset hours not in valid range: value ' + hours +
                    ' is not in the range -18 to 18');
        }
        if (hours > 0) {
            if (minutes < 0 || seconds < 0) {
                throw new DateTimeException('Zone offset minutes and seconds must be positive because hours is positive');
            }
        } else if (hours < 0) {
            if (minutes > 0 || seconds > 0) {
                throw new DateTimeException('Zone offset minutes and seconds must be negative because hours is negative');
            }
        } else if ((minutes > 0 && seconds < 0) || (minutes < 0 && seconds > 0)) {
            throw new DateTimeException('Zone offset minutes and seconds must have the same sign');
        }
        if (Math.abs(minutes) > 59) {
            throw new DateTimeException('Zone offset minutes not in valid range: abs(value) ' +
                    Math.abs(minutes) + ' is not in the range 0 to 59');
        }
        if (Math.abs(seconds) > 59) {
            throw new DateTimeException('Zone offset seconds not in valid range: abs(value) ' +
                    Math.abs(seconds) + ' is not in the range 0 to 59');
        }
        if (Math.abs(hours) === 18 && (Math.abs(minutes) > 0 || Math.abs(seconds) > 0)) {
            throw new DateTimeException('Zone offset not in valid range: -18:00 to +18:00');
        }
    }

    /**
     * 
     * @param {number} hours
     * @returns {ZoneOffset}
     */
    static ofHours(hours) {
        return ZoneOffset.ofHoursMinutesSeconds(hours, 0, 0);
    }

    /**
     * 
     * @param {number} hours
     * @param {number} minutes
     * @returns {ZoneOffset}
     */
    static ofHoursMinutes(hours, minutes) {
        return ZoneOffset.ofHoursMinutesSeconds(hours, minutes, 0);
    }

    /**
     * 
     * @param {number} hours
     * @param {number} minutes
     * @param {number} seconds
     * @returns {ZoneOffset}
     */
    static ofHoursMinutesSeconds(hours, minutes, seconds) {
        ZoneOffset._validate(hours, minutes, seconds);
        var totalSeconds = hours * LocalTime.SECONDS_PER_HOUR + minutes * LocalTime.SECONDS_PER_MINUTE + seconds;
        return ZoneOffset.ofTotalSeconds(totalSeconds);
    }

    /**
     * 
     * @param {number} totalMinutes
     * @returns {ZoneOffset}
     */
    static ofTotalMinutes(totalMinutes) {
        var totalSeconds = totalMinutes * LocalTime.SECONDS_PER_MINUTE;
        return ZoneOffset.ofTotalSeconds(totalSeconds);
    }

    /**
     * 
     * @param {number} totalSeconds
     * @returns {ZoneOffset}
     */
    static ofTotalSeconds(totalSeconds) {
        if (totalSeconds % (15 * LocalTime.SECONDS_PER_MINUTE) === 0) {
            var totalSecs = totalSeconds;
            var result = SECONDS_CACHE[totalSecs];
            if (result == null) {
                result = new ZoneOffset(totalSeconds);
                SECONDS_CACHE[totalSecs] = result;
            }
            return result;
        } else {
            return new ZoneOffset(totalSeconds);
        }
    }

    /**
     * Gets the associated time-zone rules.
     * <p>
     * The rules will always return this offset when queried.
     * The implementation class is immutable, thread-safe and serializable.
     *
     * @return {ZoneRules} the rules, not null
     */
    rules() {
        return this._rules;
    }


    /**
     * Checks if this offset is equal to another offset.
     *
     * The comparison is based on the amount of the offset in seconds.
     * This is equivalent to a comparison by ID.
     *
     * @param {*} obj - the object to check, null returns false
     * @return {boolean} true if this is equal to the other offset
     */
    equals(obj) {
        if (this === obj) {
            return true;
        }
        if (obj instanceof ZoneOffset) {
            return this._totalSeconds === obj._totalSeconds;
        }
        return false;
    }

    /**
     * @return {number}
     */
    hashCode(){
        return this._totalSeconds;
    }

    /**
     *
     * @returns {string}
     */
    toString(){
        return this._id;
    }
}

export function _init() {
    ZoneOffset.MAX_SECONDS = 18 * LocalTime.SECONDS_PER_HOUR;
    ZoneOffset.UTC = ZoneOffset.ofTotalSeconds(0);
    ZoneOffset.MIN = ZoneOffset.ofTotalSeconds(-ZoneOffset.MAX_SECONDS);
    ZoneOffset.MAX = ZoneOffset.ofTotalSeconds(ZoneOffset.MAX_SECONDS);
}